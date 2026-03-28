import { Routes, Route } from 'react-router-dom';
import SettingsHub from './settings/SettingsHub';
import LogoSettings from './settings/LogoSettings';
import BannerSettings from './settings/BannerSettings';
import FooterSettings from './settings/FooterSettings';
import BottomNavSettings from './settings/BottomNavSettings';
import QuickViewSettings from './settings/QuickViewSettings';
import OrderButtonSettings from './settings/OrderButtonSettings';
import ImageRatioSettings from './settings/ImageRatioSettings';
import ImageRadiusSettings from './settings/ImageRadiusSettings';
import TrackingSettings from './settings/TrackingSettings';
import GeneralSettings from './settings/GeneralSettings';
import ColorSettings from './settings/ColorSettings';
import AiSettings from './settings/AiSettings';
import HomepageSectionsSettings from './settings/HomepageSectionsSettings';
import ReviewSettings from './settings/ReviewSettings';
import SocialMediaSettings from './settings/SocialMediaSettings';

export default function AdminSettingsPage() {
  return (
    <Routes>
      <Route index element={<SettingsHub />} />
      <Route path="logo" element={<LogoSettings />} />
      <Route path="banner" element={<BannerSettings />} />
      <Route path="footer" element={<FooterSettings />} />
      <Route path="bottom-nav" element={<BottomNavSettings />} />
      <Route path="quickview" element={<QuickViewSettings />} />
      <Route path="order-button" element={<OrderButtonSettings />} />
      <Route path="image-ratio" element={<ImageRatioSettings />} />
      <Route path="image-radius" element={<ImageRadiusSettings />} />
      <Route path="tracking" element={<TrackingSettings />} />
      <Route path="general" element={<GeneralSettings />} />
      <Route path="colors" element={<ColorSettings />} />
      <Route path="ai" element={<AiSettings />} />
      <Route path="homepage-sections" element={<HomepageSectionsSettings />} />
      <Route path="reviews" element={<ReviewSettings />} />
      <Route path="social-media" element={<SocialMediaSettings />} />
    </Routes>
  );
}
