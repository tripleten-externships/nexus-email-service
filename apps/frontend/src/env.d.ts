declare const VITE_API_URL: string;
declare const DEPLOYMENT_ENV: string;

declare interface Window {
  Beacon: any;
  Attribution: {
    identify: (identifier: string, attributes: Record<string, any>) => void;
  };
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>> | string;
  export default content;
}
