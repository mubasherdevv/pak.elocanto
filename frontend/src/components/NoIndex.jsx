import React from 'react';
import { Helmet } from 'react-helmet-async';

const NoIndex = () => {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
    </Helmet>
  );
};

export default NoIndex;
