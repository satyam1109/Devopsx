import { ExternalLink, Info } from "lucide-react";
import type { Block } from "../lib/types";
export function LessonBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="lesson-body">
      {blocks.map((b) => {
        switch (b.type) {
          case "heading":
            return (
              <h2 key={b.id} id={b.id}>
                {b.text || b.title}
              </h2>
            );
          case "paragraph":
            return <p key={b.id}>{b.text}</p>;
          case "bullets":
            return (
              <ul key={b.id}>
                {b.text
                  ?.split("\n")
                  .filter(Boolean)
                  .map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
              </ul>
            );
          case "callout":
            return (
              <aside key={b.id} className="lesson-callout">
                <Info size={20} />
                <div>
                  {b.title && <strong>{b.title}</strong>}
                  <p>{b.text}</p>
                </div>
              </aside>
            );
          case "code":
            return (
              <figure key={b.id} className="code-block">
                <figcaption>
                  {b.title || "Example"}
                  <span>{b.language || "text"}</span>
                </figcaption>
                <pre>
                  <code>{b.text}</code>
                </pre>
              </figure>
            );
          case "image":
            return (
              <figure key={b.id} className="lesson-image">
                <img src={b.url} alt={b.alt || ""} loading="lazy" />
                {b.title && <figcaption>{b.title}</figcaption>}
              </figure>
            );
          case "link":
            return (
              <a
                key={b.id}
                className="external-resource"
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="icon-box">
                  <ExternalLink size={18} />
                </span>
                <span>
                  <strong>{b.title || "Supporting resource"}</strong>
                  {b.text && <small>{b.text}</small>}
                </span>
                <ExternalLink size={17} />
              </a>
            );
        }
      })}
    </div>
  );
}
