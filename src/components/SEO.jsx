import React from 'react';
import { Helmet } from 'react-helmet';

const SEO = ({ title, description, keywords, image, url }) => {
  const siteName = 'Clean Water Monitoring';
  const defaultDescription = 'ระบบ IoT ตรวจวัดคุณภาพน้ำแบบ Real-time (CS-KMUTNB) ติดตามค่า pH, ความขุ่น, TDS และอุณหภูมิ พร้อมแจ้งเตือนทันที';
  const defaultImage = '/logo.png'; // Should be absolute URL in production ideally
  
  const metaTitle = title ? `${title} | ${siteName}` : siteName;
  const metaDescription = description || defaultDescription;
  const metaImage = image || defaultImage;
  const metaKeywords = keywords || 'IoT, Monitoring, Water Quality, KMUTNB, CS, Real-time, เซ็นเซอร์น้ำ';

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content="napatdev" />

      {/* Open Graph / Facebook / Line */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteName} />
      {url && <meta property="og:url" content={url} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default SEO;
