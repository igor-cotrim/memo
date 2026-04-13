import { PrismLight } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';

PrismLight.registerLanguage('javascript', javascript);
PrismLight.registerLanguage('js', javascript);
PrismLight.registerLanguage('typescript', typescript);
PrismLight.registerLanguage('ts', typescript);
PrismLight.registerLanguage('python', python);
PrismLight.registerLanguage('py', python);
PrismLight.registerLanguage('java', java);
PrismLight.registerLanguage('bash', bash);
PrismLight.registerLanguage('sh', bash);
PrismLight.registerLanguage('sql', sql);
PrismLight.registerLanguage('json', json);
PrismLight.registerLanguage('css', css);

type Segment =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; content: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', lang: match[1] || 'text', content: match[2] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

type CardContentProps = {
  text: string;
};

export default function CardContent({ text }: CardContentProps) {
  if (!text) return null;

  const segments = parseSegments(text);

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === 'code') {
          return (
            <div key={i} className="text-left my-2">
              <PrismLight
                language={segment.lang}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.375rem',
                  overflowX: 'auto',
                  fontSize: '0.875rem',
                }}
              >
                {segment.content}
              </PrismLight>
            </div>
          );
        }
        return (
          <span key={i} className="whitespace-pre-wrap wrap-break-word">
            {segment.content}
          </span>
        );
      })}
    </>
  );
}
