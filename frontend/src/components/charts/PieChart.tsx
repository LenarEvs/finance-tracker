import { PieChart as RechartsPie, Pie, Cell, Tooltip } from "recharts";
import type { ExpenseByCategory } from "../../types";

interface Props {
  data: ExpenseByCategory[];
}

export function PieChart({ data }: Props) {
  return (
    <RechartsPie width={300} height={300}>
      <Pie data={data} dataKey="amount" nameKey="category_name">
        {data.map((_, i) => (
          <Cell key={i} />
        ))}
      </Pie>
      <Tooltip />
    </RechartsPie>
  );
}
