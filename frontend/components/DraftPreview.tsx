import {
  parseTemplate,
  summariseVariables,
  type Block,
  type Span,
} from "@/lib/templateRender";
import type { TemplateSpec } from "@/lib/draft";

interface Props {
  template: TemplateSpec | null;
  values: Record<string, string>;
}

export function DraftPreview({ template, values }: Props) {
  if (!template) {
    return (
      <article className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
        <p>Tell the AI which kind of document you'd like to draft, and a preview will appear here.</p>
      </article>
    );
  }

  const blocks = parseTemplate(template.content, values);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-8 text-sm leading-relaxed text-slate-900 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold text-[#032147]">{template.name}</h1>

      <CoverPageSummary template={template} values={values} />

      <div className="mt-8 space-y-3">
        {blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </article>
  );
}

function CoverPageSummary({
  template,
  values,
}: {
  template: TemplateSpec;
  values: Record<string, string>;
}) {
  if (template.variables.length === 0) return null;
  const rows = summariseVariables(template.variables, values);

  return (
    <section className="rounded border border-slate-200 bg-slate-50 p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Cover page values
      </h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-[10rem_1fr] gap-2 py-1">
            <dt className="text-slate-500">{row.name}</dt>
            <dd className={row.filled ? "text-slate-900" : "italic text-slate-400"}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function BlockView({ block }: { block: Block }) {
  const inline = block.spans.map((span, i) => <SpanView key={i} span={span} />);
  const indentStyle = block.indent > 0 ? { paddingLeft: block.indent * 16 } : undefined;

  switch (block.kind) {
    case "heading":
      return (
        <h2 className="mt-6 text-lg font-semibold text-[#032147]" style={indentStyle}>
          {inline}
        </h2>
      );
    case "subheading":
      return (
        <h3 className="mt-4 text-base font-semibold text-slate-800" style={indentStyle}>
          {inline}
        </h3>
      );
    case "list-item":
      return (
        <p className="text-slate-800" style={indentStyle}>
          {inline}
        </p>
      );
    case "paragraph":
    default:
      return <p className="text-slate-800">{inline}</p>;
  }
}

function SpanView({ span }: { span: Span }) {
  switch (span.kind) {
    case "bold":
      return <strong className="font-semibold">{span.text}</strong>;
    case "variable":
      return span.value ? (
        <em className="font-medium not-italic text-[#032147] underline decoration-dotted">
          {span.value}
        </em>
      ) : (
        <em className="italic text-slate-400">[{span.name}]</em>
      );
    case "text":
    default:
      return <span>{span.text}</span>;
  }
}
