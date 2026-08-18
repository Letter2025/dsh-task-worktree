/**
 * Ambient type declaration for CSS Modules imported from client sources.
 * tsdown's css plugin turns `x.module.css` imports into the hashed class map;
 * this file keeps `tsc --noEmit` happy for the same imports.
 */
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}