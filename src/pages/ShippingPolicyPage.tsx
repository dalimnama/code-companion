import { ShopLayout } from '@/components/layout/ShopLayout';
import { useSiteSettings } from '@/hooks/use-site-settings';

export default function ShippingPolicyPage() {
  const { data: settings } = useSiteSettings();
  const insideCost = settings?.shipping_cost_inside_dhaka || '60';
  const outsideCost = settings?.shipping_cost_outside_dhaka || '120';
  const freeThreshold = settings?.free_delivery_threshold || '1999';

  return (
    <ShopLayout>
      <div className="container-shop py-10 max-w-3xl mx-auto prose prose-sm">
        <h1>Shipping Policy</h1>
        <p>Last updated: February 2026</p>
        <h2>Delivery Areas</h2>
        <p>We deliver to all districts across Bangladesh.</p>
        <h2>Shipping Rates & Times</h2>
        <table>
          <thead><tr><th>Area</th><th>Cost</th><th>Time</th></tr></thead>
          <tbody>
            <tr><td>Inside Dhaka</td><td>৳{insideCost}</td><td>2-3 business days</td></tr>
            <tr><td>Outside Dhaka</td><td>৳{outsideCost}</td><td>4-7 business days</td></tr>
          </tbody>
        </table>
        <h2>Free Delivery</h2>
        <p>Free delivery inside Dhaka on orders over ৳{freeThreshold}.</p>
        <h2>Tracking</h2>
        <p>You will receive tracking information via SMS once your order is shipped.</p>
      </div>
    </ShopLayout>
  );
}
