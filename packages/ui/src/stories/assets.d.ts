// Story-only image assets, bundled by Vite (Storybook) as URLs.
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
