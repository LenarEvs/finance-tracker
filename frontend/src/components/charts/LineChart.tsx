import { LineChart as RechartsLine, Line, XAxis, YAxis, Tooltip } from "recharts";
import type { MonthlyTrend } from "../../types";

interface Props {
  data: MonthlyTrend[];
}

export function LineChart({ data }: Props) {
  return (
    <RechartsLine width={500} height={250} data={data}>
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="income" />
      <Line type="monotone" dataKey="expense" />
    </RechartsLine>
  );
}
