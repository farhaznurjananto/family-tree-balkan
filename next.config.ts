import type { NextConfig } from "next";
import withTM from 'next-transpile-modules';

const withTranspileModules = withTM(["@balkangraph/familytree.js"]);

const nextConfig: NextConfig = {
  /* config options here */
};

export default withTranspileModules(nextConfig);
