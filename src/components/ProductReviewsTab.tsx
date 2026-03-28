import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ProductReviewsTabProps {
  productId: string;
}

export function ProductReviewsTab({ productId }: ProductReviewsTabProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !text.trim() || rating === 0) throw new Error('সব তথ্য পূরণ করুন');
      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        customer_name: name.trim(),
        customer_phone: email.trim() || null,
        rating,
        review_text: text.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('রিভিউ সাবমিট হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে দেখা যাবে।');
      setName('');
      setEmail('');
      setRating(0);
      setText('');
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      {/* Existing Reviews */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">লোড হচ্ছে...</div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b border-border/50 pb-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{r.customer_name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString('bn-BD')}
                </span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= r.rating ? 'fill-warning text-warning' : 'text-muted-foreground/20'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.review_text}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground text-sm">
          এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!
        </div>
      )}

      {/* Submit Review Form */}
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-bold uppercase tracking-wide">Leave a Review</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your email address will not be published. Required fields are marked <span className="text-destructive">*</span>
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium min-w-[100px]">
            Your Rating <span className="text-destructive">*</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} type="button" onClick={() => setRating(s)} className="p-0.5">
                <Star
                  className={`h-7 w-7 transition-colors ${
                    s <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/30 hover:text-warning/50'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="text-sm font-medium min-w-[100px]">
            Your Name <span className="text-destructive">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="flex-1"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="text-sm font-medium min-w-[100px]">
            Email <span className="text-destructive">*</span>
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={100}
            className="flex-1"
          />
        </div>

        {/* Review Text */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
          <label className="text-sm font-medium min-w-[100px] sm:pt-2">
            Your Review <span className="text-destructive">*</span>
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={1000}
            className="flex-1"
          />
        </div>

        <Button
          onClick={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !name.trim() || !text.trim() || rating === 0}
          className="uppercase font-bold tracking-wider px-8"
          size="lg"
        >
          {submitMutation.isPending ? 'সাবমিট হচ্ছে...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
}