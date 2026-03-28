import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, MapPin, Users, TrendingUp } from 'lucide-react';


const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const sourceLabels: Record<string, string> = {
  direct: 'ডাইরেক্ট',
  facebook: 'ফেসবুক',
  instagram: 'ইনস্টাগ্রাম',
  tiktok: 'টিকটক',
  linkedin: 'লিঙ্কডইন',
  google: 'গুগল',
  youtube: 'ইউটিউব',
  twitter: 'টুইটার/X',
  bing: 'বিং',
  other: 'অন্যান্য',
};

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

function getStartDate(period: Period): string | null {
  const now = new Date();
  switch (period) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    case 'week': { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
    case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString(); }
    case 'year': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString(); }
    case 'all': return null;
  }
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month');

  const { data: visitors = [], isLoading } = useQuery({
    queryKey: ['admin-visitors', period],
    queryFn: async () => {
      const startDate = getStartDate(period);
      let query = supabase.from('visitors').select('*').order('created_at', { ascending: false });
      if (startDate) query = query.gte('created_at', startDate);
      const { data } = await query.limit(10000);
      return (data as any[]) || [];
    },
  });

  const stats = useMemo(() => {
    // Source breakdown
    const sourceMap: Record<string, number> = {};
    const countryMap: Record<string, number> = {};
    const divisionMap: Record<string, number> = {};
    const districtMap: Record<string, number> = {};
    const dailyMap: Record<string, number> = {};

    visitors.forEach((v: any) => {
      sourceMap[v.source] = (sourceMap[v.source] || 0) + 1;
      if (v.country) countryMap[v.country] = (countryMap[v.country] || 0) + 1;
      if (v.division) divisionMap[v.division] = (divisionMap[v.division] || 0) + 1;
      if (v.district) districtMap[v.district] = (districtMap[v.district] || 0) + 1;
      const day = v.created_at?.slice(0, 10);
      if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
    });

    const sourceData = Object.entries(sourceMap)
      .map(([name, value]) => ({ name: sourceLabels[name] || name, value }))
      .sort((a, b) => b.value - a.value);

    const countryData = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const divisionData = Object.entries(divisionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const districtData = Object.entries(districtMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    const dailyData = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return { sourceData, countryData, divisionData, districtData, dailyData, total: visitors.length };
  }, [visitors]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 overflow-x-hidden pb-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">ভিজিটর অ্যানালিটিক্স</h1>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">আজ</SelectItem>
            <SelectItem value="week">গত ৭ দিন</SelectItem>
            <SelectItem value="month">গত ৩০ দিন</SelectItem>
            <SelectItem value="year">গত ১ বছর</SelectItem>
            <SelectItem value="all">সব সময়</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">মোট ভিজিটর</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">টপ সোর্স</p>
              <p className="text-lg font-bold">{stats.sourceData[0]?.name || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">দেশ সংখ্যা</p>
              <p className="text-lg font-bold">{stats.countryData.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">বিভাগ সংখ্যা</p>
              <p className="text-lg font-bold">{stats.divisionData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily visitors chart */}
      <div className="bg-card border rounded-xl p-5">
        <h2 className="font-bold mb-4">দৈনিক ভিজিটর</h2>
        <div className="overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="h-64" style={{ minWidth: Math.max(500, stats.dailyData.length * 35) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [value, 'ভিজিটর']} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="ভিজিটর" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
      {/* Source pie chart */}
        <div className="bg-card border rounded-xl p-5 overflow-hidden">
          <h2 className="font-bold mb-4">ট্রাফিক সোর্স</h2>
          {stats.sourceData.length > 0 ? (
            <>
              <div className="overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="h-64" style={{ minWidth: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.sourceData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={2}
                        label={false}
                      >
                        {stats.sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'ভিজিটর']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {stats.sourceData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold">{s.value}</span>
                      <span className="text-xs text-muted-foreground">({((s.value / stats.total) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">কোন ডাটা নেই</p>
          )}
        </div>

        {/* Division & Country */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-bold mb-4">বিভাগ</h2>
          {stats.divisionData.length > 0 ? (
            <div className="space-y-2">
              {stats.divisionData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">কোন ডাটা নেই</p>
          )}

          <h3 className="font-bold mt-6 mb-3">দেশ</h3>
          {stats.countryData.length > 0 ? (
            <div className="space-y-2">
              {stats.countryData.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span>{c.name}</span>
                  <span className="font-medium">{c.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">কোন ডাটা নেই</p>
          )}
        </div>

        {/* District */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-bold mb-4">জেলা</h2>
          {stats.districtData.length > 0 ? (
            <div className="space-y-2">
              {stats.districtData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{d.name}</span>
                  </div>
                  <span className="font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">কোন ডাটা নেই</p>
          )}
        </div>
      </div>
    </div>
  );
}
