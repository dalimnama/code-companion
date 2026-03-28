import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useMemo } from 'react';
import { useSiteSettings } from '@/hooks/use-site-settings';

interface Review {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
}

const fallbackReviews: Review[] = [
  { name: 'Saiful Islam', location: 'Dhaka', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 5, text: 'Impressed with Rikapio! Fast delivery and the product quality is excellent. Trusted site for shopping.' },
  { name: 'Nusrat Jahan', location: 'Chittagong', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5, text: 'অসাধারণ কোয়ালিটি! ছবির সাথে প্রোডাক্ট হুবহু মিলে গেছে। ক্যাশ অন ডেলিভারি সুবিধাও পেয়েছি।' },
  { name: 'Rafiq Ahmed', location: 'Sylhet', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', rating: 4, text: 'Very good quality products at affordable prices. Delivery was on time. Will definitely order again!' },
  { name: 'Fatema Begum', location: 'Rajshahi', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', rating: 5, text: 'পণ্যের মান অনেক ভালো। দ্রুত ডেলিভারি পেয়েছি। অনেক ধন্যবাদ Rikapio কে।' },
  { name: 'Tanvir Hasan', location: 'Khulna', avatar: 'https://randomuser.me/api/portraits/men/52.jpg', rating: 5, text: 'Best online shopping experience! Great customer service and genuine products. Highly recommended.' },
];

export function CustomerReviews() {
  const plugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));
  const { data: settings } = useSiteSettings();

  const reviews: Review[] = useMemo(() => {
    if (settings?.customer_reviews) {
      try {
        const parsed = JSON.parse(settings.customer_reviews);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return fallbackReviews;
  }, [settings?.customer_reviews]);

  const title = settings?.reviews_title || 'Customer Reviews';

  if (reviews.length === 0) return null;

  return (
    <section className="container-shop py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
          <div className="w-12 h-1 bg-primary rounded-full mt-2" />
        </div>

        <Carousel
          opts={{ align: 'start', loop: true }}
          plugins={[plugin.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {reviews.map((review, i) => (
              <CarouselItem key={i} className="pl-3 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-muted/40 border border-border/30 p-5 sm:p-6 h-full flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=random`}
                      alt={review.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                      loading="lazy"
                    />
                    <div>
                      <h4 className="font-bold text-sm">
                        {review.name}, <span className="font-normal text-muted-foreground">{review.location}</span>
                      </h4>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star
                            key={j}
                            className={`h-3.5 w-3.5 ${j < review.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed flex-1">{review.text}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="flex justify-center gap-1.5 mt-4">
            {reviews.map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            ))}
          </div>
        </Carousel>
      </motion.div>
    </section>
  );
}
