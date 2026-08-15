/**
 * @file multi-version.ts
 * @description P12-087: Multi-version operation.
 * Facilitates serving several API versions simultaneously with a shared implementation.
 */

export interface SharedImplementation<TSharedInput, TSharedOutput> {
  execute(input: TSharedInput): Promise<TSharedOutput>;
}

export interface VersionHandler<TExternalInput, TExternalOutput, TSharedInput, TSharedOutput> {
  version: string;
  mapInput(external: TExternalInput): TSharedInput;
  mapOutput(shared: TSharedOutput): TExternalOutput;
}

export class MultiVersionRouter<TSharedInput, TSharedOutput> {
  private handlers = new Map<string, VersionHandler<any, any, TSharedInput, TSharedOutput>>();
  private sharedImplementation: SharedImplementation<TSharedInput, TSharedOutput>;

  constructor(sharedImplementation: SharedImplementation<TSharedInput, TSharedOutput>) {
    this.sharedImplementation = sharedImplementation;
  }

  public register<TExternalInput, TExternalOutput>(
    handler: VersionHandler<TExternalInput, TExternalOutput, TSharedInput, TSharedOutput>
  ) {
    this.handlers.set(handler.version, handler);
  }

  public async serve(version: string, externalInput: any): Promise<any> {
    const handler = this.handlers.get(version);
    if (!handler) {
      throw new Error(`Unsupported API version: ${version}`);
    }

    const sharedInput = handler.mapInput(externalInput);
    const sharedOutput = await this.sharedImplementation.execute(sharedInput);
    return handler.mapOutput(sharedOutput);
  }
}
