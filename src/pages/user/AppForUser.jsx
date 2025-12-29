// AppForUser.js
import React from 'react';
import { Helmet } from 'react-helmet'; 
import LiffLogin from '../../auth/LiffLogin';
import Mapping from './Mapping';

const AppForUser = () => {
  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>Clean Water Monitoring</title>
        <meta name="description" content="แดชบอร์ดสำหรับผู้ใช้ Clean Water Monitoring เพื่อตรวจวัดคุณภาพน้ำและดูแผนที่จุดบริการ" />
        <meta name="robots" content="noindex" /> 
      </Helmet>

      {/* เนื้อหาของหน้า */}
      <LiffLogin>
        <Mapping />
      </LiffLogin>
    </>
  );
};

export default AppForUser;