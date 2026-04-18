"use client";

import { motion, useMotionValue, useMotionTemplate } from "motion/react";
import Link from "next/link";
import { type MouseEvent } from "react";

type Product = {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
};

const InferenceIcon = () => (
  <svg width="128" height="155" viewBox="0 0 128 155" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.10938 110.276L14.2205 106.132V56.6339L7.10938 52.5131V110.276Z" fill="#059345" />
    <path d="M127.36 40.4843L64 77.2621V150.794C64.8296 150.794 65.6356 150.58 66.3704 150.151L125.63 115.755C127.099 114.897 128 113.325 128 111.634V42.8424C128 42.0087 127.763 41.1988 127.36 40.4843ZM120.889 110.276L71.1111 139.146V81.383L120.889 52.5133V110.276Z" fill="#059345" />
    <path d="M63.9965 11.2329L14.2188 40.1264L21.3299 44.2472L63.9965 19.4984V11.2329Z" fill="#059345" />
    <path d="M0 42.8664V111.634C0 113.326 0.900741 114.898 2.37037 115.755L61.6296 150.151C62.3644 150.58 63.1704 150.794 64 150.794V77.2623L0.64 40.4844C0.237037 41.199 0 42.0327 0 42.8664ZM7.11111 52.5134L56.8889 81.3831V139.146L7.11111 110.277V52.5134ZM120.889 52.5134V110.277L113.778 106.156V56.6581L120.889 52.5373V52.5134ZM113.778 40.1271L106.667 44.248L64 19.4991V11.2574L113.778 40.1271Z" fill="url(#inf_g0)" />
    <path d="M14.2228 106.133L56.8895 130.881V139.123L7.11174 110.277L14.2228 106.156V106.133ZM71.1117 130.905V139.147L120.89 110.277L113.778 106.156L71.1117 130.905ZM127.361 40.4851L64.0006 77.2392L0.640625 40.4851C1.04359 39.7705 1.63618 39.175 2.371 38.7463L61.6303 4.37422C63.0999 3.5167 64.9014 3.5167 66.371 4.37422L125.63 38.7463C126.365 39.175 126.958 39.7705 127.361 40.4851ZM113.778 40.1278L64.0006 11.2343L14.2228 40.1278L64.0006 68.9975L113.778 40.1278Z" fill="url(#inf_g1)" />
    <defs>
      <linearGradient id="inf_g0" x1="28.7526" y1="131.071" x2="89.6413" y2="26.1168" gradientUnits="userSpaceOnUse">
        <stop stopColor="#80EE64" /><stop offset="0.18" stopColor="#7BEB63" /><stop offset="0.36" stopColor="#6FE562" /><stop offset="0.55" stopColor="#5ADA60" /><stop offset="0.74" stopColor="#3DCA5D" /><stop offset="0.93" stopColor="#18B759" /><stop offset="1" stopColor="#09AF58" />
      </linearGradient>
      <linearGradient id="inf_g1" x1="95.6925" y1="124.879" x2="34.8038" y2="19.9482" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BFF9B4" /><stop offset="1" stopColor="#80EE64" />
      </linearGradient>
    </defs>
  </svg>
);

const TrainingIcon = () => (
  <svg width="128" height="148" viewBox="0 0 128 148" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#trn_clip)">
      <path d="M122.667 46.2003L117.333 55.4496L53.3333 18.476V8.87089C53.3333 8.01711 53.5704 7.21076 53.9733 6.49927L122.667 46.1766V46.2003ZM42.6667 27.3696V36.951L106.667 73.9246L112 64.6753L43.3067 24.998C42.9037 25.7094 42.6667 26.5158 42.6667 27.3696ZM32 45.8446V55.4259L96 92.3996L101.333 83.1502L32.64 43.4729C32.237 44.1844 32 44.9908 32 45.8446ZM21.3333 64.3432V73.9246L85.3333 110.898L90.6667 101.649L21.9733 61.9716C21.5704 62.6831 21.3333 63.4895 21.3333 64.3432ZM10.6667 82.8182V92.3996L74.6667 129.373L80 120.124L11.3067 80.4466C10.9037 81.1581 10.6667 81.9644 10.6667 82.8182ZM0 101.317V108.171C0 109.855 0.900741 111.444 2.37037 112.274L61.6296 146.496C62.5067 146.994 63.4785 147.16 64.4504 147.066L69.3333 138.623L0.64 98.9453C0.237037 99.6568 0 100.463 0 101.317Z" fill="url(#trn_g0)" />
      <path d="M127.55 37.7333L122.667 46.1762L53.974 6.49893C54.3769 5.78744 54.9695 5.19453 55.7043 4.76764L61.6302 1.3525C63.0999 0.498712 64.9014 0.498712 66.371 1.3525L125.63 35.5751C126.507 36.0731 127.147 36.8558 127.55 37.7333ZM53.334 18.4756L45.0377 23.2663C44.3028 23.6932 43.7103 24.2861 43.3073 24.9976L112.001 64.6749L117.334 55.4256L53.334 18.4756ZM42.6673 36.9506L34.371 41.7413C33.6362 42.1682 33.0436 42.7611 32.6406 43.4726L101.334 83.1499L106.667 73.9006L42.6673 36.9269V36.9506ZM32.0006 55.4256L23.7043 60.2163C22.9695 60.6432 22.3769 61.2361 21.974 61.9476L90.6673 101.625L96.0006 92.3755L32.0006 55.4019V55.4256ZM21.334 73.9243L13.0377 78.715C12.3028 79.1419 11.7103 79.7348 11.3073 80.4463L80.0006 120.124L85.3339 110.874L21.334 73.9006V73.9243ZM10.6673 92.3993L2.371 97.1899C1.63618 97.6168 1.04359 98.2097 0.640625 98.9212L69.334 138.599L74.6673 129.349L10.6673 92.3755V92.3993Z" fill="url(#trn_g1)" />
      <path d="M117.333 45.8443V55.4257L109.037 60.2164C107.567 61.0702 106.667 62.6354 106.667 64.3193V73.9007L98.3704 78.6914C96.9007 79.5451 96 81.1104 96 82.7943V92.3756L87.7037 97.1663C86.2341 98.0201 85.3333 99.5854 85.3333 101.269V110.851L77.037 115.641C75.5674 116.495 74.6667 118.06 74.6667 119.744V129.326L66.3704 134.116C64.9007 134.97 64 136.535 64 138.219V147.065C64.8296 147.065 65.6356 146.852 66.3704 146.425L125.63 112.202C127.099 111.349 128 109.783 128 108.1V39.6307C128 38.7769 127.763 37.9705 127.36 37.259L119.704 41.694C118.234 42.5478 117.333 44.113 117.333 45.7969V45.8443Z" fill="#059345" />
    </g>
    <defs>
      <linearGradient id="trn_g0" x1="29.6533" y1="128.021" x2="88.3666" y2="26.3767" gradientUnits="userSpaceOnUse">
        <stop stopColor="#80EE64" /><stop offset="0.18" stopColor="#7BEB63" /><stop offset="0.36" stopColor="#6FE562" /><stop offset="0.55" stopColor="#5ADA60" /><stop offset="0.74" stopColor="#3DCA5D" /><stop offset="0.93" stopColor="#18B759" /><stop offset="1" stopColor="#09AF58" />
      </linearGradient>
      <linearGradient id="trn_g1" x1="95.8347" y1="123.325" x2="34.4407" y2="17.0571" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BFF9B4" /><stop offset="1" stopColor="#80EE64" />
      </linearGradient>
      <clipPath id="trn_clip"><rect width="128" height="146.424" fill="white" transform="translate(0 0.712158)" /></clipPath>
    </defs>
  </svg>
);

const SandboxesIcon = () => (
  <svg width="128" height="147" viewBox="0 0 128 147" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#sbx_clip)">
      <path d="M127.36 102.282C127.763 102.993 128 103.799 128 104.652V107.378C128 109.061 127.1 110.625 125.63 111.479L66.3708 145.683C65.636 146.11 64.8301 146.323 64.0004 146.323V138.856L127.36 102.282ZM14.2227 101.902L21.3338 106.003L35.556 97.8016L28.4449 93.7008L14.2227 101.902ZM64.0004 106.027V113.493C64.8301 113.493 65.636 113.28 66.3708 112.853L125.63 78.649C127.1 77.7957 128 76.2312 128 74.5483V71.8223C128 70.969 127.763 70.1631 127.36 69.452L64.0004 106.027ZM14.2227 69.0727L21.3338 73.1734L35.556 64.972L28.4449 60.8712L14.2227 69.0727ZM127.36 36.5749L64.0004 73.1497V80.6164C64.8301 80.6164 65.636 80.4031 66.3708 79.9764L92.4449 64.9246L106.667 56.7231L117.334 50.5601L125.63 45.772C127.1 44.9186 128 43.3542 128 41.6712V38.9453C128 38.092 127.763 37.286 127.36 36.5749ZM64.0004 15.692V7.49048L14.2227 36.2194L21.3338 40.3201L64.0004 15.692Z" fill="#059345" />
      <path d="M0.64 102.281L64 138.856V146.323C63.1704 146.323 62.3644 146.11 61.6296 145.683L2.37037 111.479C0.900741 110.625 0 109.061 0 107.378V104.652C0 103.799 0.237037 102.993 0.64 102.281ZM92.4444 97.8015L106.667 106.003L113.778 101.902L99.5556 93.7007L92.4444 97.8015ZM0 71.7985V74.5245C0 76.2074 0.900741 77.7719 2.37037 78.6252L61.6296 112.83C62.3644 113.256 63.1704 113.47 64 113.47V106.003L0.64 69.4282C0.237037 70.1393 0 70.9452 0 71.7985ZM92.4444 64.9482L106.667 73.1496L113.778 69.0489L99.5556 60.8474L92.4444 64.9482ZM0 38.9452V41.6711C0 43.3541 0.900741 44.9185 2.37037 45.7719L50.56 73.6L61.6296 80C62.3644 80.4267 63.1704 80.64 64 80.64V73.1733L0.64 36.5748C0.237037 37.2859 0 38.0919 0 38.9452ZM113.778 36.2193L64 7.46667V15.6682L106.667 40.2963L113.778 36.1956V36.2193Z" fill="url(#sbx_g0)" />
      <path d="M127.361 36.5748C126.958 35.8637 126.365 35.2711 125.63 34.8444L66.371 0.64C64.9014 -0.213333 63.0999 -0.213333 61.6303 0.64L2.371 34.8444C1.63618 35.2711 1.04359 35.8637 0.640625 36.5748L64.0006 73.1496L127.361 36.5748ZM56.8184 60.8L14.2228 36.2193L64.0006 7.46667L113.778 36.1956L64.0006 64.9481L56.8184 60.8Z" fill="url(#sbx_g1)" />
      <path d="M127.361 69.4281C126.958 68.717 126.365 68.1244 125.63 67.6977L106.667 56.7466L99.5562 60.8473L113.778 69.0488L106.667 73.1495L64.0006 97.7777L44.374 86.4473L14.2228 69.0488L28.4451 60.8473L21.334 56.7466L2.371 67.6977C1.63618 68.1244 1.04359 68.717 0.640625 69.4281L64.0006 106.003L127.361 69.4281Z" fill="url(#sbx_g2)" />
      <path d="M125.63 100.551L106.667 89.6001L99.5562 93.7008L113.778 101.902L106.667 106.003L64.0006 130.631L44.374 119.301L14.2228 101.902L28.4451 93.7008L21.334 89.6001L2.371 100.551C1.63618 100.978 1.04359 101.57 0.640625 102.282L64.0006 138.856L127.361 102.282C126.958 101.57 126.365 100.978 125.63 100.551Z" fill="url(#sbx_g3)" />
      <g style={{mixBlendMode:"multiply"}} opacity="0.75"><path d="M21.3338 64.9481L28.4449 60.8473L25.956 59.4251L21.3338 56.7466L14.2227 60.8473L21.3338 64.9481Z" fill="#10A550" /></g>
      <g style={{mixBlendMode:"multiply"}} opacity="0.75"><path d="M106.666 64.9481L113.777 60.8473L111.288 59.4251L106.666 56.7466L99.5547 60.8473L106.666 64.9481Z" fill="#10A550" /></g>
      <g style={{mixBlendMode:"multiply"}} opacity="0.75"><path d="M21.3338 97.8016L28.4449 93.7008L25.956 92.2549L21.3338 89.6001L14.2227 93.7008L21.3338 97.8016Z" fill="#10A550" /></g>
      <g style={{mixBlendMode:"multiply"}} opacity="0.75"><path d="M106.666 97.8016L113.777 93.7008L111.288 92.2549L106.666 89.6001L99.5547 93.7008L106.666 97.8016Z" fill="#10A550" /></g>
      <g style={{mixBlendMode:"multiply"}} opacity="0.75"><path d="M21.332 64.9483V73.1735L35.5543 64.9483L28.4431 60.8475L21.332 64.9483Z" fill="#09AF58" /></g>
      <g style={{mixBlendMode:"multiply"}} opacity="0.75"><path d="M21.332 97.8015V106.027L35.5543 97.8015L28.4431 93.7008L21.332 97.8015Z" fill="#10A550" /></g>
      <g style={{mixBlendMode:"multiply"}} opacity="0.75"><path d="M106.668 97.8015V106.027L92.4453 97.8015L99.5564 93.7008L106.668 97.8015Z" fill="#10A550" /></g>
      <g style={{mixBlendMode:"multiply"}} opacity="0.75"><path d="M106.668 64.9483V73.1735L92.4453 64.9483L99.5564 60.8475L106.668 64.9483Z" fill="#10A550" /></g>
    </g>
    <defs>
      <linearGradient id="sbx_g0" x1="25.197" y1="124.681" x2="85.6415" y2="19.9822" gradientUnits="userSpaceOnUse">
        <stop stopColor="#80EE64" /><stop offset="0.18" stopColor="#7BEB63" /><stop offset="0.36" stopColor="#6FE562" /><stop offset="0.55" stopColor="#5ADA60" /><stop offset="0.74" stopColor="#3DCA5D" /><stop offset="0.93" stopColor="#18B759" /><stop offset="1" stopColor="#09AF58" />
      </linearGradient>
      <linearGradient id="sbx_g1" x1="79.8347" y1="64.0237" x2="47.8347" y2="8.60444" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BFF9B4" /><stop offset="1" stopColor="#80EE64" />
      </linearGradient>
      <linearGradient id="sbx_g2" x1="79.8347" y1="96.877" x2="47.8347" y2="41.434" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BFF9B4" /><stop offset="1" stopColor="#80EE64" />
      </linearGradient>
      <linearGradient id="sbx_g3" x1="79.8347" y1="129.707" x2="47.8347" y2="74.2875" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BFF9B4" /><stop offset="1" stopColor="#80EE64" />
      </linearGradient>
      <clipPath id="sbx_clip"><rect width="128" height="146.347" fill="white" /></clipPath>
    </defs>
  </svg>
);

const BatchIcon = () => (
  <svg width="114" height="134" viewBox="0 0 114 134" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#bat_clip)">
      <path d="M70.1525 9.19957L57.0003 16.7672L43.8481 9.19957C44.207 8.56894 44.7348 8.04341 45.3892 7.66503L54.8892 2.19953C56.1981 1.44277 57.8025 1.44277 59.1114 2.19953L68.6114 7.66503C69.2659 8.04341 69.7936 8.56894 70.1525 9.19957ZM68.6114 57.4221L59.1114 51.9566C57.8025 51.1998 56.1981 51.1998 54.8892 51.9566L45.3892 57.4221C44.7348 57.8005 44.207 58.326 43.8481 58.9567L57.0003 66.5243L70.1525 58.9567C69.7936 58.326 69.2659 57.8005 68.6114 57.4221ZM25.3336 32.5331L15.8336 27.0676C14.5248 26.3108 12.9203 26.3108 11.6114 27.0676L2.11142 32.5331C1.45698 32.9114 0.929201 33.437 0.570312 34.0676L13.7225 41.6352L26.8748 34.0676C26.5159 33.437 25.9881 32.9114 25.3336 32.5331ZM113.43 34.0676C113.071 33.437 112.544 32.9114 111.889 32.5331L102.389 27.0676C101.08 26.3108 99.4759 26.3108 98.167 27.0676L88.667 32.5331C88.0125 32.9114 87.4847 33.437 87.1259 34.0676L100.278 41.6352L113.43 34.0676ZM25.3336 82.3112L15.8336 76.8456C14.5248 76.0889 12.9203 76.0889 11.6114 76.8456L2.11142 82.3112C1.45698 82.6895 0.929201 83.2151 0.570312 83.8457L13.7225 91.4133L26.8748 83.8457C26.5159 83.2151 25.9881 82.6895 25.3336 82.3112ZM111.889 82.3112L102.389 76.8456C101.08 76.0889 99.4759 76.0889 98.167 76.8456L88.667 82.3112C88.0125 82.6895 87.4847 83.2151 87.1259 83.8457L100.278 91.4133L113.43 83.8457C113.071 83.2151 112.544 82.6895 111.889 82.3112ZM68.6114 107.179L59.1114 101.714C57.8025 100.957 56.1981 100.957 54.8892 101.714L45.3892 107.179C44.7348 107.558 44.207 108.083 43.8481 108.714L57.0003 116.281L70.1525 108.714C69.7936 108.083 69.2659 107.558 68.6114 107.179Z" fill="url(#bat_g0)" />
      <path d="M113.43 83.8458C113.789 84.4765 114 85.1912 114 85.9479V96.8789C114 98.3714 113.198 99.7588 111.889 100.516L102.389 105.981C101.735 106.359 101.017 106.549 100.278 106.549V91.4134L113.43 83.8458ZM13.7227 41.6353V56.7706C14.4615 56.7706 15.1793 56.5814 15.8338 56.203L25.3338 50.7375C26.6427 49.9807 27.4449 48.5933 27.4449 47.1008V36.1698C27.4449 35.4131 27.2338 34.6984 26.8749 34.0677L13.7227 41.6353ZM13.7227 91.3924V106.528C14.4615 106.528 15.1793 106.338 15.8338 105.96L25.3338 100.495C26.6427 99.7378 27.4449 98.3504 27.4449 96.8579V85.9269C27.4449 85.1702 27.2338 84.4554 26.8749 83.8248L13.7227 91.3924ZM57.0004 116.281V131.417C57.7393 131.417 58.4571 131.228 59.1116 130.849L68.6116 125.384C69.9204 124.627 70.7227 123.239 70.7227 121.747V110.816C70.7227 110.059 70.5116 109.344 70.1527 108.714L57.0004 116.281ZM57.0004 16.7673V31.9025C57.7393 31.9025 58.4571 31.7134 59.1116 31.335L68.6116 25.8695C69.9204 25.1127 70.7227 23.7253 70.7227 22.2328V11.3018C70.7227 10.5451 70.5116 9.83034 70.1527 9.19971L57.0004 16.7673ZM57.0004 66.5244V81.6596C57.7393 81.6596 58.4571 81.4704 59.1116 81.092L68.6116 75.6265C69.9204 74.8698 70.7227 73.4824 70.7227 71.9899V61.0589C70.7227 60.3021 70.5116 59.5874 70.1527 58.9568L57.0004 66.5244ZM113.43 34.0677L100.278 41.6353V56.7706C101.017 56.7706 101.735 56.5814 102.389 56.203L111.889 50.7375C113.198 49.9807 114 48.5933 114 47.1008V36.1698C114 35.4131 113.789 34.6984 113.43 34.0677Z" fill="#059345" />
      <path d="M100.278 41.6353V56.7706C99.5389 56.7706 98.8211 56.5814 98.1667 56.203L88.6667 50.7375C87.3578 49.9807 86.5556 48.5933 86.5556 47.1008V36.1698C86.5556 35.4131 86.7667 34.6984 87.1256 34.0677L100.278 41.6353ZM0 36.1698V47.1008C0 48.5933 0.802222 49.9807 2.11111 50.7375L11.6111 56.203C12.2656 56.5814 12.9833 56.7706 13.7222 56.7706V41.6353L0.57 34.0677C0.211111 34.6984 0 35.4131 0 36.1698ZM0 85.9479V96.8789C0 98.3714 0.802222 99.7588 2.11111 100.516L11.6111 105.981C12.2656 106.359 12.9833 106.549 13.7222 106.549V91.4134L0.57 83.8458C0.211111 84.4765 0 85.1912 0 85.9479ZM43.2778 11.3018V22.2328C43.2778 23.7253 44.08 25.1127 45.3889 25.8695L54.8889 31.335C55.5433 31.7134 56.2611 31.9025 57 31.9025V16.7673L43.8478 9.19971C43.4889 9.83034 43.2778 10.5451 43.2778 11.3018ZM43.2778 110.816V121.747C43.2778 123.239 44.08 124.648 45.3889 125.384L54.8889 130.849C55.5433 131.228 56.2611 131.417 57 131.417V116.281L43.8478 108.714C43.4889 109.344 43.2778 110.059 43.2778 110.816ZM43.2778 61.0589V71.9899C43.2778 73.4824 44.08 74.8698 45.3889 75.6265L54.8889 81.092C55.5433 81.4704 56.2611 81.6596 57 81.6596V66.5244L43.8478 58.9568C43.4889 59.5874 43.2778 60.3021 43.2778 61.0589ZM86.5556 85.9479V96.8789C86.5556 98.3714 87.3578 99.7588 88.6667 100.516L98.1667 105.981C98.8211 106.359 99.5389 106.549 100.278 106.549V91.4134L87.1256 83.8458C86.7667 84.4765 86.5556 85.1912 86.5556 85.9479Z" fill="url(#bat_g1)" />
    </g>
    <defs>
      <linearGradient id="bat_g0" x1="81.9325" y1="101.945" x2="32.1141" y2="15.3007" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BFF9B4" /><stop offset="1" stopColor="#80EE64" />
      </linearGradient>
      <linearGradient id="bat_g1" x1="25.2067" y1="113.78" x2="75.0251" y2="27.1147" gradientUnits="userSpaceOnUse">
        <stop stopColor="#80EE64" /><stop offset="0.18" stopColor="#7BEB63" /><stop offset="0.36" stopColor="#6FE562" /><stop offset="0.55" stopColor="#5ADA60" /><stop offset="0.74" stopColor="#3DCA5D" /><stop offset="0.93" stopColor="#18B759" /><stop offset="1" stopColor="#09AF58" />
      </linearGradient>
      <clipPath id="bat_clip"><rect width="114" height="134" fill="white" /></clipPath>
    </defs>
  </svg>
);

const NotebooksIcon = () => (
  <svg width="114" height="133" viewBox="0 0 114 133" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#ntb_clip)">
      <path d="M113.431 27.8503L111.89 28.74L107.098 31.5151C107.457 32.1506 107.668 32.8708 107.668 33.6334V96.5691C108.407 96.5691 109.124 96.3784 109.779 95.9971L111.89 94.7685C113.199 94.0059 114.001 92.6078 114.001 91.1038V29.9687C114.001 29.2061 113.79 28.4858 113.431 27.8503Z" fill="#059345" />
      <path d="M63.902 5.84131C63.5431 6.47681 63.332 7.19704 63.332 7.95964V69.1159C63.332 70.6199 64.1343 72.018 65.4431 72.7806L105.554 96.0187C106.209 96.4 106.926 96.5907 107.665 96.5907V33.6338C107.665 32.1298 106.863 30.7317 105.554 29.9691L63.902 5.84131Z" fill="url(#ntb_g0)" />
      <path d="M92.3216 40.0733L90.7805 40.963L85.9883 43.738C86.3472 44.3735 86.5583 45.0938 86.5583 45.8564V108.792C87.2972 108.792 88.0149 108.601 88.6694 108.22L90.7805 106.991C92.0894 106.229 92.8916 104.831 92.8916 103.327V42.1705C92.8916 41.4079 92.6805 40.6876 92.3216 40.0521V40.0733Z" fill="#059345" />
      <path d="M42.7927 18.0638C42.4338 18.6993 42.2227 19.4196 42.2227 20.1822V81.3385C42.2227 82.8425 43.0249 84.2406 44.3338 85.0032L84.4449 108.241C85.0993 108.623 85.8171 108.813 86.556 108.813V45.8776C86.556 44.3735 85.7538 42.9754 84.4449 42.2128L42.7927 18.0638Z" fill="url(#ntb_g1)" />
      <path d="M71.2083 52.3167L69.6672 53.2064L64.875 55.9814C65.2339 56.6169 65.445 57.3372 65.445 58.0998V121.035C66.1839 121.035 66.9017 120.845 67.5561 120.463L69.6672 119.235C70.9761 118.472 71.7783 117.074 71.7783 115.57V54.4139C71.7783 53.6513 71.5672 52.931 71.2083 52.2955V52.3167Z" fill="#059345" />
      <path d="M21.6794 30.2865C21.3205 30.922 21.1094 31.6422 21.1094 32.4048V93.5611C21.1094 95.0651 21.9116 96.4632 23.2205 97.2258L63.3316 120.464C63.986 120.845 64.7038 121.036 65.4427 121.036V58.1002C65.4427 56.5962 64.6405 55.1981 63.3316 54.4355L21.6794 30.2865Z" fill="url(#ntb_g2)" />
      <path d="M50.099 64.5402L48.5578 65.4299L43.7656 68.2049C44.1245 68.8404 44.3356 69.5607 44.3356 70.3233V133.259C45.0745 133.259 45.7923 133.068 46.4467 132.687L48.5578 131.458C49.8667 130.696 50.669 129.298 50.669 127.794V66.6374C50.669 65.8748 50.4578 65.1545 50.099 64.519V64.5402Z" fill="#059345" />
      <path d="M113.43 27.8501L107.667 31.1971L107.097 31.5148C106.738 30.8793 106.21 30.3497 105.556 29.9684L63.9036 5.84062C64.2625 5.20512 64.7903 4.67554 65.4448 4.29424L67.5559 3.0656C68.8648 2.303 70.4692 2.303 71.7781 3.0656L111.889 26.3037C112.544 26.685 113.071 27.2146 113.43 27.8501ZM90.7781 38.5265L50.667 15.2884C49.3581 14.5258 47.7536 14.5258 46.4448 15.2884L44.3336 16.517C43.6792 16.8983 43.1514 17.4279 42.7925 18.0634L84.4448 42.1912C85.0992 42.5725 85.627 43.1021 85.9859 43.7376L86.5559 43.4199L92.3192 40.0729C91.9603 39.4374 91.4325 38.9078 90.7781 38.5265ZM69.667 50.7493L29.5559 27.5112C28.247 26.7486 26.6425 26.7486 25.3336 27.5112L23.2225 28.7398C22.5681 29.1211 22.0403 29.6507 21.6814 30.2862L63.3336 54.414C63.9881 54.7953 64.5159 55.3249 64.8748 55.9604L65.4448 55.6426L71.2081 52.2957C70.8492 51.6602 70.3214 51.1306 69.667 50.7493ZM48.5559 62.9933L8.44476 39.7551C7.13587 38.9925 5.53142 38.9925 4.22253 39.7551L2.11142 40.9838C1.45698 41.3651 0.929201 41.8947 0.570312 42.5302L42.2225 66.658C42.877 67.0393 43.4048 67.5689 43.7636 68.2044L44.3336 67.8866L50.097 64.5396C49.7381 63.9041 49.2103 63.3745 48.5559 62.9933Z" fill="url(#ntb_g3)" />
      <path d="M0.57 42.5309C0.211111 43.1664 0 43.8866 0 44.6492V105.806C0 107.31 0.802222 108.708 2.11111 109.47L42.2222 132.708C42.8767 133.09 43.5944 133.28 44.3333 133.28V70.3446C44.3333 68.8406 43.5311 67.4425 42.2222 66.6799L0.57 42.5309Z" fill="url(#ntb_g4)" />
    </g>
    <defs>
      <linearGradient id="ntb_g0" x1="71.3965" y1="76.2123" x2="100.043" y2="26.7704" gradientUnits="userSpaceOnUse">
        <stop stopColor="#80EE64" /><stop offset="0.18" stopColor="#7BEB63" /><stop offset="0.36" stopColor="#6FE562" /><stop offset="0.55" stopColor="#5ADA60" /><stop offset="0.74" stopColor="#3DCA5D" /><stop offset="0.93" stopColor="#18B759" /><stop offset="1" stopColor="#09AF58" />
      </linearGradient>
      <linearGradient id="ntb_g1" x1="50.2871" y1="88.4561" x2="78.9334" y2="38.993" gradientUnits="userSpaceOnUse">
        <stop stopColor="#80EE64" /><stop offset="0.18" stopColor="#7BEB63" /><stop offset="0.36" stopColor="#6FE562" /><stop offset="0.55" stopColor="#5ADA60" /><stop offset="0.74" stopColor="#3DCA5D" /><stop offset="0.93" stopColor="#18B759" /><stop offset="1" stopColor="#09AF58" />
      </linearGradient>
      <linearGradient id="ntb_g2" x1="29.1738" y1="100.679" x2="57.8201" y2="51.2368" gradientUnits="userSpaceOnUse">
        <stop stopColor="#80EE64" /><stop offset="0.18" stopColor="#7BEB63" /><stop offset="0.36" stopColor="#6FE562" /><stop offset="0.55" stopColor="#5ADA60" /><stop offset="0.74" stopColor="#3DCA5D" /><stop offset="0.93" stopColor="#18B759" /><stop offset="1" stopColor="#09AF58" />
      </linearGradient>
      <linearGradient id="ntb_g3" x1="67.9359" y1="54.2022" x2="45.6554" y2="15.7356" gradientUnits="userSpaceOnUse">
        <stop stopColor="#BFF9B4" /><stop offset="1" stopColor="#80EE64" />
      </linearGradient>
      <linearGradient id="ntb_g4" x1="8.06444" y1="112.902" x2="36.7107" y2="63.46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#80EE64" /><stop offset="0.18" stopColor="#7BEB63" /><stop offset="0.36" stopColor="#6FE562" /><stop offset="0.55" stopColor="#5ADA60" /><stop offset="0.74" stopColor="#3DCA5D" /><stop offset="0.93" stopColor="#18B759" /><stop offset="1" stopColor="#09AF58" />
      </linearGradient>
      <clipPath id="ntb_clip"><rect width="114" height="133" fill="white" /></clipPath>
    </defs>
  </svg>
);

const PRODUCTS: Product[] = [
  {
    title: "Command Center",
    description: "Real-time dashboard with KPIs, hotspot maps, priority queues and bias auditing, all in one view.",
    href: "/dashboard",
    icon: <InferenceIcon />,
  },
  {
    title: "Case Management",
    description: "Full lifecycle tracking from intake through triage, matching, dispatch and verified closure.",
    href: "/cases",
    icon: <TrainingIcon />,
  },
  {
    title: "Incident Response",
    description:
      "Group related cases under incidents with target tracking, progress monitoring and coordinated field response.",
    href: "/incidents",
    icon: <SandboxesIcon />,
  },
  {
    title: "Route Planning",
    description: "Optimized itineraries for field workers with nearest-neighbor routing, distance estimates and stop management.",
    href: "/itineraries",
    icon: <BatchIcon />,
  },
  {
    title: "Volunteer Hub",
    description:
      "Self-service portal for volunteers to browse eligible cases, express interest and coordinate assignment handoff.",
    href: "/volunteer-hub",
    icon: <NotebooksIcon />,
  },
];

const CpuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20v2" /><path d="M12 2v2" /><path d="M17 20v2" /><path d="M17 2v2" />
    <path d="M2 12h2" /><path d="M2 17h2" /><path d="M2 7h2" /><path d="M20 12h2" />
    <path d="M20 17h2" /><path d="M20 7h2" /><path d="M7 20v2" /><path d="M7 2v2" />
    <rect x="4" y="4" width="16" height="16" rx="2" /><rect x="8" y="8" width="8" height="8" rx="1" />
  </svg>
);

const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" />
  </svg>
);

const PlugIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" />
    <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
  </svg>
);

const NetworkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" /><path d="M12 12V8" />
  </svg>
);

const PLATFORM_FEATURES = [
  {
    title: "Confidence-decoupled scoring",
    description:
      "Priority ranking uses severity, vulnerability and freshness, never data confidence. Uncertain but urgent cases get escalated for human review, not buried.",
    icon: <CpuIcon />,
  },
  {
    title: "PostGIS-powered hotspots",
    description:
      "Geocoded demand mapping via Nominatim and PostGIS. Track where needs are emerging and plan response coverage with location context.",
    icon: <DatabaseIcon />,
  },
  {
    title: "Multi-channel fusion",
    description:
      "Web forms, CSV partner imports and email intake all feed the same triage workflow, reducing manual copy-paste across tools.",
    icon: <PlugIcon />,
  },
  {
    title: "Realtime subscriptions",
    description:
      "Supabase Realtime subscriptions refresh operational views as case and assignment updates happen, so teams can react quickly.",
    icon: <NetworkIcon />,
  },
];

function SpotlightFeature({
  feature,
  index,
}: {
  feature: (typeof PLATFORM_FEATURES)[number];
  index: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const spotlightBg = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(75,131,62,0.12), transparent 80%)`;

  return (
    <motion.div
      className="group relative flex flex-col gap-5 rounded-lg p-4 -m-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-lg opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: spotlightBg }}
      />
      <div className="relative gap-4.5 flex flex-col items-start sm:flex-row sm:items-center">
        <div className="text-c-pale-green-30">{feature.icon}</div>
        <h4 className="font-goga text-xl font-normal leading-[1.5] tracking-normal">
          {feature.title}
        </h4>
      </div>
      <p className="relative text-[#5d695d] hidden font-normal sm:block">
        {feature.description}
      </p>
    </motion.div>
  );
}

export default function ProductsSection() {
  return (
    <div className="marketing-light-bg-container py-16 text-black">
      <div className="marketing-container border-landing-dark-green-border flex flex-col gap-8 pb-1 sm:gap-10">
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            id="capabilities"
            className="text-landing-green-text-dark mb-0 scroll-mt-28 text-xs tracking-[1.2px] md:scroll-mt-32 sm:mb-5"
          >
            CAPABILITIES
          </div>
          <h2 className="marketing-h2">Everything your response team needs</h2>
        </motion.div>

        <div className="product-cards -mx-4 flex w-[calc(100%+32px)] flex-col gap-8 overflow-x-auto p-4 [scrollbar-width:none] sm:flex-row sm:justify-start">
          {PRODUCTS.map((p) => (
            <Link
              key={p.title}
              href={p.href}
              className="product-card group relative z-0 flex cursor-pointer gap-6 sm:w-[232px] sm:flex-col"
            >
              <div className="pointer-events-none absolute -inset-4 -z-10 bg-[#CBDECA] opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100" />
              <div className="flex h-[158px] w-[158px] flex-shrink-0 items-center justify-center bg-black p-10 sm:h-[232px] sm:w-[232px] sm:p-14">
                {p.icon}
              </div>
              <div className="flex flex-col gap-2 md:gap-5">
                <h4 className="font-goga mt-auto text-xl font-normal tracking-normal text-black">
                  {p.title}
                </h4>
                <div className="text-[#5d695d] justify-self-stretch font-normal mb-auto">
                  {p.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="marketing-container pt-13 flex flex-col gap-20 sm:flex-row sm:pt-16">
        <motion.div
          className="flex flex-col gap-6 sm:w-1/3"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            id="architecture"
            className="text-landing-green-text-dark mb-0 scroll-mt-28 text-xs tracking-[1.2px] md:scroll-mt-32"
          >
            ARCHITECTURE
          </div>
          <h2 className="marketing-h2">Built on a powerful foundation</h2>
          <p className="text-[#5d695d] font-normal">
            From AI agents to realtime infrastructure, every layer of Sahaya is
            engineered to deliver fast, fair and accountable humanitarian
            response at scale.
          </p>
          <div>
            <Link
              className="btn-marketing btn-secondary btn-light"
              href="/dashboard"
            >
              View Dashboard
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-15 sm:w-2/3">
          {PLATFORM_FEATURES.map((f, i) => (
            <SpotlightFeature key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
