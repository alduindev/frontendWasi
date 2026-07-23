import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getCategoryAnalytics } from '../../data/dashboard'
import { useI18n } from '../../hooks/useI18n'
import Card from '../atoms/Card'
import Carousel from '../molecules/Carousel'

function ChartCard({ children, title }) {
  return (
    <Card className="min-w-0 p-3 sm:p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">{title}</h2>
      <div className="h-44 min-w-0 sm:h-40 2xl:h-48">{children}</div>
    </Card>
  )
}

export default function InventoryCharts({ products }) {
  const { t } = useI18n()
  const data = getCategoryAnalytics(products)
  const charts = [
    {
      color: '#59006a',
      dataKey: 'products',
      decimals: false,
      key: 'products',
      title: t('dashboard.charts.productsByCategory'),
    },
    {
      color: '#ffb872',
      dataKey: 'stock',
      decimals: false,
      key: 'stock',
      title: t('dashboard.charts.stockByCategory'),
    },
    {
      color: '#742284',
      dataKey: 'value',
      decimals: true,
      key: 'value',
      title: t('dashboard.charts.inventoryValue'),
    },
    {
      color: '#10b981',
      dataKey: 'revenue',
      decimals: true,
      key: 'revenue',
      title: t('dashboard.charts.revenue'),
    },
  ]

  return (
    <Carousel
      ariaLabel={t('dashboard.visualization')}
      gridClassName="auto-cols-[minmax(min(420px,calc(100vw-2rem)),1fr)] xl:auto-cols-[minmax(460px,1fr)]"
      items={charts.map((chart) => ({
        key: chart.key,
        node: (
          <ChartCard title={chart.title}>
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={data}>
                <CartesianGrid stroke="#eee5f1" vertical={false} />
                <XAxis dataKey="category" tickLine={false} />
                <YAxis allowDecimals={chart.decimals} tickLine={false} />
                <Tooltip />
                <Bar dataKey={chart.dataKey} fill={chart.color} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ),
      }))}
    />
  )
}
