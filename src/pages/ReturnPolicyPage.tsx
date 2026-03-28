import { ShopLayout } from '@/components/layout/ShopLayout';

export default function ReturnPolicyPage() {
  return (
    <ShopLayout>
      <div className="container-shop py-10 max-w-3xl mx-auto prose prose-sm">
        <h1>Return Policy</h1>
        <p>Last updated: February 2026</p>
        <h2>7-Day Return Policy</h2>
        <p>You may return most items within 7 days of delivery for a full refund or exchange.</p>
        <h2>Conditions</h2>
        <ul>
          <li>Items must be unused and in original packaging</li>
          <li>Include all tags and accessories</li>
          <li>Provide your order number and reason for return</li>
        </ul>
        <h2>Non-Returnable Items</h2>
        <ul>
          <li>Personal care and beauty products (opened)</li>
          <li>Undergarments and innerwear</li>
          <li>Items marked as "Final Sale"</li>
        </ul>
        <h2>How to Return</h2>
        <p>Contact us via WhatsApp or email with your order number. We will arrange a pickup within 2-3 business days.</p>
      </div>
    </ShopLayout>
  );
}
