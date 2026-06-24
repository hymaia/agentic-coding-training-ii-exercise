declare module "zod" {
  export const z: {
    string(): { kind: "string" };
    object<TShape extends Record<string, unknown>>(shape: TShape): {
      kind: "object";
      shape: TShape;
    };
  };
}
