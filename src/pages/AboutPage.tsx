import { ShopLayout } from '@/components/layout/ShopLayout';

export default function AboutPage() {
  return (
    <ShopLayout>
      <div className="container-shop py-10 max-w-3xl mx-auto prose prose-sm">
        <h1>About rikapio</h1>
        <p>rikapio is your trusted online shopping destination in Bangladesh. We bring you authentic products from top brands at competitive prices, with fast delivery across the country.</p>
        <h2>Our Mission</h2>
        <p>To make quality products accessible to everyone in Bangladesh through a seamless, trustworthy online shopping experience.</p>
        <h2>Why Choose Us?</h2>
        <ul>
          <li>100% Authentic Products</li>
          <li>Fast Delivery Across Bangladesh</li>
          <li>Easy 7-Day Return Policy</li>
          <li>Secure Payment Options (COD, bKash, Nagad)</li>
          <li>Dedicated Customer Support</li>
        </ul>
        <p>We are committed to providing exceptional service and building lasting relationships with our customers.</p>
      </div>
    </ShopLayout>
  );
}
