import Svg, { G, Path, Rect } from 'react-native-svg';
import { ONBOARDING_ILLUSTRATION } from '../../constants/onboarding-theme';
import { useI18n } from '../../lib/i18n';

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 618.862;
const ASPECT = VIEW_HEIGHT / VIEW_WIDTH;

/** undraw_onboarding_dcq2 — assets/images/undraw_onboarding_dcq2.svg */
export default function SetupModeIllustration({ width = ONBOARDING_ILLUSTRATION.width }) {
  const { t } = useI18n();
  const height = width * ASPECT;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      accessibilityRole="image"
      accessibilityLabel={t('onboarding.setupMode.illustrationA11y')}
    >
      <G transform="translate(-560 -230.251)">
        <Path
          d="M15.18,488.765c0,.873.479,1.575,1.074,1.575H552c.6,0,1.074-.7,1.074-1.575S552.6,487.19,552,487.19H16.254C15.659,487.191,15.18,487.892,15.18,488.765Z"
          fill="#e6e6e6"
          transform="translate(674.868 358.773)"
        />
        <Rect width={19.128} height={3.375} fill="#b6b3c5" transform="translate(865.532 842.346)" />
        <Rect width={19.128} height={3.375} fill="#b6b3c5" transform="translate(1034.87 842.91)" />
        <Path
          d="M353.105,370.945a27.562,27.562,0,0,1-54.387,0H229.146V521.719H422.68V370.945Z"
          fill="#d6d6e3"
          transform="translate(634.088 321.188)"
        />
        <Rect width={193.53} height={5.248} fill="#090814" transform="translate(863.798 830.961)" />
        <Path
          d="M789.211,487.734H10.789A10.8,10.8,0,0,1,0,476.945V32.7a10.8,10.8,0,0,1,10.789-10.79H789.211A10.8,10.8,0,0,1,800,32.7V476.945a10.8,10.8,0,0,1-10.789,10.789Z"
          fill="#090814"
          transform="translate(560 208.34)"
        />
        <Rect width={761.745} height={429.818} fill="#fff" transform="translate(578.125 247.327)" />
        <G transform="translate(83 26)">
          <Path d="M14,0A14,14,0,1,1,0,14,14,14,0,0,1,14,0Z" fill="#3B82F6" transform="translate(743 274)" />
          <Path d="M14,0A14,14,0,1,1,0,14,14,14,0,0,1,14,0Z" fill="#3B82F6" transform="translate(803 274)" />
          <Path d="M14,0A14,14,0,1,1,0,14,14,14,0,0,1,14,0Z" fill="#e6e6e6" transform="translate(923 274)" />
          <Path d="M14,0A14,14,0,1,1,0,14,14,14,0,0,1,14,0Z" fill="#e6e6e6" transform="translate(983 274)" />
          <Path d="M0,0H134.912V8H0Z" fill="#3B82F6" transform="translate(755 284)" />
          <Path d="M0,0H114V8H0Z" fill="#e6e6e6" transform="translate(886 284)" />
          <Path d="M14,0A14,14,0,1,1,0,14,14,14,0,0,1,14,0Z" fill="#3B82F6" transform="translate(863 274)" />
        </G>
        <Path d="M6,0H42a6,6,0,0,1,0,12H6A6,6,0,0,1,6,0Z" fill="#e6e6e6" transform="translate(816 376)" />
        <Path d="M14,0H266a14,14,0,0,1,0,28H14A14,14,0,0,1,14,0Z" fill="#e6e6e6" transform="translate(816 392)" />
        <Path d="M6,0H42a6,6,0,0,1,0,12H6A6,6,0,0,1,6,0Z" fill="#e6e6e6" transform="translate(816 444)" />
        <Path d="M14,0H266a14,14,0,0,1,0,28H14A14,14,0,0,1,14,0Z" fill="#e6e6e6" transform="translate(816 460)" />
        <Path d="M6,0H42a6,6,0,0,1,0,12H6A6,6,0,0,1,6,0Z" fill="#e6e6e6" transform="translate(816 512)" />
        <Path d="M14,0H266a14,14,0,0,1,0,28H14A14,14,0,0,1,14,0Z" fill="#e6e6e6" transform="translate(816 528)" />
        <Path d="M14,0H266a14,14,0,0,1,0,28H14A14,14,0,0,1,14,0Z" fill="#3B82F6" transform="translate(816 596)" />
      </G>
    </Svg>
  );
}
