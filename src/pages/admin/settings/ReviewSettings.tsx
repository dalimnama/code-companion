import { SettingsPageWrapper } from './SettingsPageWrapper';
import { useSettingsData } from './useSettingsData';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Star, Plus, Trash2, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Review {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
}

const defaultReviews: Review[] = [
  { name: 'Saiful Islam', location: 'Dhaka', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', rating: 5, text: 'Impressed with Rikapio! Fast delivery and the product quality is excellent. Trusted site for shopping.' },
  { name: 'Nusrat Jahan', location: 'Chittagong', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', rating: 5, text: 'অসাধারণ কোয়ালিটি! ছবির সাথে প্রোডাক্ট হুবহু মিলে গেছে।' },
  { name: 'Rafiq Ahmed', location: 'Sylhet', avatar: 'https://randomuser.me/api/portraits/men/67.jpg', rating: 4, text: 'Very good quality products at affordable prices. Delivery was on time.' },
];

export default function ReviewSettings() {
  const { values, setValues, saveMutation } = useSettingsData();
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [sectionTitle, setSectionTitle] = useState('Customer Reviews');

  useEffect(() => {
    if (values.customer_reviews) {
      try {
        setReviews(JSON.parse(values.customer_reviews));
      } catch {}
    }
    if (values.reviews_title) {
      setSectionTitle(values.reviews_title);
    }
  }, [values.customer_reviews, values.reviews_title]);

  const updateReview = (index: number, field: keyof Review, value: string | number) => {
    const updated = [...reviews];
    updated[index] = { ...updated[index], [field]: value };
    setReviews(updated);
  };

  const addReview = () => {
    setReviews([...reviews, { name: '', location: '', avatar: '', rating: 5, text: '' }]);
  };

  const removeReview = (index: number) => {
    setReviews(reviews.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setValues((prev) => ({
      ...prev,
      customer_reviews: JSON.stringify(reviews),
      reviews_title: sectionTitle,
    }));
    setTimeout(() => saveMutation.mutate(), 50);
  };

  return (
    <SettingsPageWrapper
      title="কাস্টমার রিভিউ সেটিংস"
      onSave={handleSave}
      isSaving={saveMutation.isPending}
    >
      <div className="space-y-6">
        {/* Section Title */}
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <Label className="font-semibold">সেকশন টাইটেল</Label>
          <Input
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            placeholder="Customer Reviews"
          />
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">রিভিউ সমূহ ({reviews.length})</h3>
            <Button size="sm" variant="outline" onClick={addReview}>
              <Plus className="h-4 w-4 mr-1" /> নতুন রিভিউ
            </Button>
          </div>

          {reviews.map((review, i) => (
            <div key={i} className="bg-card border rounded-xl p-4 space-y-3 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground">রিভিউ #{i + 1}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeReview(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">নাম</Label>
                  <Input
                    value={review.name}
                    onChange={(e) => updateReview(i, 'name', e.target.value)}
                    placeholder="নাম লিখুন"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">লোকেশন</Label>
                  <Input
                    value={review.location}
                    onChange={(e) => updateReview(i, 'location', e.target.value)}
                    placeholder="শহর"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">অ্যাভাটার URL</Label>
                <div className="flex gap-2 mt-1">
                  {review.avatar && (
                    <img src={review.avatar} alt="" className="w-9 h-9 rounded-full object-cover border shrink-0" />
                  )}
                  <Input
                    value={review.avatar}
                    onChange={(e) => updateReview(i, 'avatar', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">রেটিং</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateReview(i, 'rating', star)}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          star <= review.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">রিভিউ টেক্সট</Label>
                <Textarea
                  value={review.text}
                  onChange={(e) => updateReview(i, 'text', e.target.value)}
                  placeholder="রিভিউ লিখুন..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SettingsPageWrapper>
  );
}
