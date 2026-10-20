import type { ChainNode } from "@/content/cases";

/*
  An access chain that draws itself as the chapter scrolls. The engine publishes
  --sc-p on the enclosing flow act; CSS turns it into stroke-dashoffset and node
  opacity. Without JS or with reduced motion it renders fully drawn.
  The SVG is decorative; the ordered list below it carries the same content.
*/
export function ChainDiagram({ title, nodes }: { title: string; nodes: ChainNode[] }) {
  const W = 760, nodeW = 232, nodeH = 62, gapY = 40;
  const H = nodes.length * nodeH + (nodes.length - 1) * gapY;
  const col = (i: number) => (i % 2 === 0 ? 40 : W - nodeW - 40);
  return (
    <figure className="chain" data-sc-act="flow" style={{ margin: 0 }}>
      <figcaption className="sr-only">{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="hidden md:block">
        <path className="chain__line" pathLength={1}
          d={nodes.slice(1).map((_, k) => {
            // Elbow from the bottom of node k to the top of node k+1, so the
            // connector never crosses a label.
            const x0 = col(k) + nodeW / 2, y0 = k * (nodeH + gapY) + nodeH;
            const x1 = col(k + 1) + nodeW / 2, y1 = (k + 1) * (nodeH + gapY);
            const ym = (y0 + y1) / 2;
            return `M${x0} ${y0} L${x0} ${ym} L${x1} ${ym} L${x1} ${y1}`;
          }).join(" ")} />
        {nodes.map((n, i) => {
          const x = col(i), y = i * (nodeH + gapY);
          const noteX = i % 2 === 0 ? x + nodeW + 20 : x - 20;
          return (
            <g key={n.label} className="chain__node" style={{ ["--i" as string]: i }}>
              <rect x={x} y={y} width={nodeW} height={nodeH} rx={10} />
              <circle className="chain__dot" cx={x + 18} cy={y + nodeH / 2} r={4} />
              <text className="chain__label" x={x + 32} y={y + nodeH / 2 + 6}>{n.label}</text>
              <text className="chain__note" x={noteX} y={y + nodeH / 2 + 4} textAnchor={i % 2 === 0 ? "start" : "end"}>{n.note}</text>
            </g>
          );
        })}
      </svg>
      <ol className="chain-list md:sr-only">
        {nodes.map((n) => (
          <li key={n.label}><div><strong>{n.label}</strong><span>{n.note}</span></div></li>
        ))}
      </ol>
    </figure>
  );
}
