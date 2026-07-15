// Allows TypeScript to import .yaml files as JSON-typed modules.
declare module '*.yaml' {
  const value: any
  export default value
}
declare module '*.yml' {
  const value: any
  export default value
}
