import { useState, useEffect } from 'react';
import { useKV } from '../hooks/use-kv-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Star, ThumbsUp, ThumbsDown, ShieldCheck, ChatCircle } from '@phosphor-icons/react';
import type { ProductReview, ReviewVote, ProductRatingStats, Product, AuthSession, B2BOrder } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductReviewsProps {
  productId: string;
  authSession: AuthSession | null;
}

export default function ProductReviews({ productId, authSession }: ProductReviewsProps) {
  const adminId = authSession?.adminId;
  const [reviews, setReviews] = useKV<ProductReview[]>('productReviews', [], adminId);
  const [votes, setVotes] = useKV<ReviewVote[]>('reviewVotes', [], adminId);
  const [products] = useKV<Product[]>('products', [], adminId);
  const [b2bOrders] = useKV<B2BOrder[]>('b2b-orders', [], adminId);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');

  const product = products?.find((p) => p.id === productId);
  
  const userId = authSession?.userId || authSession?.adminId;
  
  const hasPurchasedProduct = (b2bOrders || []).some(
    order => 
      order.customerId === userId &&
      order.deliveredDate &&
      order.items.some(item => item.productId === productId)
  );

  const productReviews = (reviews || []).filter(
    (r) => r.productId === productId && r.branchId === authSession?.branchId
  );

  const stats: ProductRatingStats = {
    productId,
    averageRating: 0,
    totalReviews: productReviews.length,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    verifiedPurchaseCount: productReviews.filter((r) => r.isVerifiedPurchase).length,
  };

  if (productReviews.length > 0) {
    stats.averageRating =
      productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    productReviews.forEach((r) => {
      stats.ratingDistribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    });
  }

  const sortedReviews = [...productReviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'helpful') {
      return b.helpfulCount - a.helpfulCount;
    } else {
      return b.rating - a.rating;
    }
  });

  const handleSubmitReview = () => {
    if (!authSession) {
      toast.error('Yorum yapabilmek için giriş yapmalısınız');
      return;
    }

    if (!hasPurchasedProduct) {
      toast.error('Sadece satın aldığınız ürünler için yorum yapabilirsiniz');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Lütfen yorum yazınız');
      return;
    }

    const review: ProductReview = {
      id: `review-${Date.now()}`,
      productId,
      productName: product?.name || '',
      customerId: authSession.userId || authSession.adminId,
      customerName: authSession.userName,
      rating: newRating,
      comment: newComment,
      isVerifiedPurchase: hasPurchasedProduct,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
      notHelpfulCount: 0,
      isApproved: authSession.userRole === 'owner',
      branchId: authSession.branchId,
      adminId: authSession.adminId,
    };

    setReviews((current) => [...(current || []), review]);
    setNewComment('');
    setNewRating(5);
    toast.success('Yorumunuz alındı' + (review.isApproved ? '' : ' (onay bekliyor)'));
  };

  const handleVote = (reviewId: string, isHelpful: boolean) => {
    if (!authSession) {
      toast.error('Oy vermek için giriş yapmalısınız');
      return;
    }

    const userId = authSession.userId || authSession.adminId;
    const existingVote = (votes || []).find(
      (v) => v.reviewId === reviewId && v.userId === userId
    );

    if (existingVote) {
      if (existingVote.isHelpful === isHelpful) {
        setVotes((current) =>
          (current || []).filter((v) => v.id !== existingVote.id)
        );
        setReviews((current) =>
          (current || []).map((r) => {
            if (r.id === reviewId) {
              return {
                ...r,
                [isHelpful ? 'helpfulCount' : 'notHelpfulCount']:
                  r[isHelpful ? 'helpfulCount' : 'notHelpfulCount'] - 1,
              };
            }
            return r;
          })
        );
      } else {
        setVotes((current) =>
          (current || []).map((v) =>
            v.id === existingVote.id ? { ...v, isHelpful } : v
          )
        );
        setReviews((current) =>
          (current || []).map((r) => {
            if (r.id === reviewId) {
              return {
                ...r,
                helpfulCount: r.helpfulCount + (isHelpful ? 1 : -1),
                notHelpfulCount: r.notHelpfulCount + (isHelpful ? -1 : 1),
              };
            }
            return r;
          })
        );
      }
    } else {
      const vote: ReviewVote = {
        id: `vote-${Date.now()}`,
        reviewId,
        userId,
        isHelpful,
        createdAt: new Date().toISOString(),
      };

      setVotes((current) => [...(current || []), vote]);
      setReviews((current) =>
        (current || []).map((r) => {
          if (r.id === reviewId) {
            return {
              ...r,
              [isHelpful ? 'helpfulCount' : 'notHelpfulCount']:
                r[isHelpful ? 'helpfulCount' : 'notHelpfulCount'] + 1,
            };
          }
          return r;
        })
      );
    }
  };

  const handleReply = (reviewId: string) => {
    if (!authSession || !replyText.trim()) {
      return;
    }

    setReviews((current) =>
      (current || []).map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            replyText,
            repliedBy: authSession.userId || authSession.adminId,
            repliedByName: authSession.userName,
            repliedAt: new Date().toISOString(),
          };
        }
        return r;
      })
    );

    setReplyingTo(null);
    setReplyText('');
    toast.success('Yanıt gönderildi');
  };

  const handleApproveReview = (reviewId: string) => {
    setReviews((current) =>
      (current || []).map((r) =>
        r.id === reviewId ? { ...r, isApproved: true } : r
      )
    );
    toast.success('Yorum onaylandı');
  };

  const getUserVote = (reviewId: string) => {
    if (!authSession) return null;
    const userId = authSession.userId || authSession.adminId;
    return (votes || []).find((v) => v.reviewId === reviewId && v.userId === userId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star weight="fill" className="h-6 w-6 text-yellow-500" />
            Ürün Değerlendirmeleri
          </CardTitle>
          <CardDescription>{product?.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-5xl font-bold">{stats.averageRating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        weight="fill"
                        className={cn(
                          'h-5 w-5',
                          star <= Math.round(stats.averageRating)
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stats.totalReviews} değerlendirme
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5];
                const percentage =
                  stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm">{rating}</span>
                      <Star weight="fill" className="h-4 w-4 text-yellow-500" />
                    </div>
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {hasPurchasedProduct ? (
            <div className="space-y-4">
              <h3 className="font-semibold">Yeni Değerlendirme</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm">Puanınız:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      onClick={() => setNewRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        weight="fill"
                        className={cn(
                          'h-8 w-8 transition-colors',
                          star <= (hoveredStar || newRating)
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-sm font-semibold">{newRating}/5</span>
              </div>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ürün hakkında düşüncelerinizi paylaşın..."
                rows={4}
              />
              <Button onClick={handleSubmitReview}>Değerlendirme Gönder</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold">Yeni Değerlendirme</h3>
              <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
                <ShieldCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Yorum yapabilmek için önce bu ürünü B2B platformundan satın almanız gerekmektedir.
                </p>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Tüm Değerlendirmeler ({sortedReviews.length})
              </h3>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('recent')}
                >
                  En Yeni
                </Button>
                <Button
                  variant={sortBy === 'helpful' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('helpful')}
                >
                  En Yararlı
                </Button>
                <Button
                  variant={sortBy === 'rating' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('rating')}
                >
                  En Yüksek Puan
                </Button>
              </div>
            </div>

            {sortedReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Henüz değerlendirme yapılmamış
              </div>
            ) : (
              <div className="space-y-4">
                {sortedReviews.map((review) => {
                  const userVote = getUserVote(review.id);
                  return (
                    <Card key={review.id} className={!review.isApproved ? 'opacity-50' : ''}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                              {review.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{review.customerName}</span>
                                {review.isVerifiedPurchase && (
                                  <Badge variant="outline" className="gap-1">
                                    <ShieldCheck className="h-3 w-3" weight="fill" />
                                    Onaylı Alıcı
                                  </Badge>
                                )}
                                {!review.isApproved && (
                                  <Badge variant="secondary">Onay Bekliyor</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      weight="fill"
                                      className={cn(
                                        'h-4 w-4',
                                        star <= review.rating
                                          ? 'text-yellow-500'
                                          : 'text-gray-300'
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                            </div>
                          </div>
                          {authSession?.userRole === 'owner' && !review.isApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveReview(review.id)}
                            >
                              Onayla
                            </Button>
                          )}
                        </div>

                        {review.comment && (
                          <p className="text-sm leading-relaxed">{review.comment}</p>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(review.id, true)}
                            className={cn(
                              'gap-1',
                              userVote?.isHelpful && 'text-green-600'
                            )}
                          >
                            <ThumbsUp
                              weight={userVote?.isHelpful ? 'fill' : 'regular'}
                              className="h-4 w-4"
                            />
                            {review.helpfulCount > 0 && review.helpfulCount}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVote(review.id, false)}
                            className={cn(
                              'gap-1',
                              userVote && !userVote.isHelpful && 'text-red-600'
                            )}
                          >
                            <ThumbsDown
                              weight={userVote && !userVote.isHelpful ? 'fill' : 'regular'}
                              className="h-4 w-4"
                            />
                            {review.notHelpfulCount > 0 && review.notHelpfulCount}
                          </Button>
                          {(authSession?.userRole === 'owner' ||
                            authSession?.userRole === 'manager') &&
                            !review.replyText && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo(review.id)}
                                className="gap-1"
                              >
                                <ChatCircle className="h-4 w-4" />
                                Yanıtla
                              </Button>
                            )}
                        </div>

                        {review.replyText && (
                          <Card className="bg-muted/50 mt-2">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">Satıcı Yanıtı</Badge>
                                <span className="text-sm font-semibold">
                                  {review.repliedByName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {review.repliedAt &&
                                    new Date(review.repliedAt).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                              <p className="text-sm">{review.replyText}</p>
                            </CardContent>
                          </Card>
                        )}

                        {replyingTo === review.id && (
                          <div className="space-y-2 mt-2">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Yanıtınızı yazın..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleReply(review.id)}>
                                Gönder
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                              >
                                İptal
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
