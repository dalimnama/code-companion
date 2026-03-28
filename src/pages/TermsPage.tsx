import { ShopLayout } from '@/components/layout/ShopLayout';

export default function TermsPage() {
  return (
    <ShopLayout>
      <div className="container-shop py-10 max-w-3xl mx-auto prose prose-sm">
        <h1>Terms & Conditions</h1>
        <p>Last updated: February 2026</p>
        <h2>General</h2>
        <p>By using rikapio, you agree to these terms and conditions. We reserve the right to update these terms at any time.</p>
        <h2>Orders & Payments</h2>
        <p>All prices are listed in BDT (৳). We accept Cash on Delivery, bKash, and Nagad. Orders are confirmed upon successful payment or COD acceptance.</p>
        <h2>Shipping</h2>
        <p>We deliver across Bangladesh. Delivery times and charges vary based on location.</p>
        <h2>Returns</h2>
        <p>Please refer to our Return Policy for details on returns and refunds.</p>
      </div>
    </ShopLayout>
  );
}
