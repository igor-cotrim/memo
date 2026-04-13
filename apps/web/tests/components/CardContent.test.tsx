import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import CardContent from '../../src/components/CardContent';

vi.mock('react-syntax-highlighter', () => ({
  PrismLight: Object.assign(
    ({ children, language }: { children: string; language?: string }) => (
      <pre data-testid="code-block" data-language={language}>
        {children}
      </pre>
    ),
    { registerLanguage: vi.fn() },
  ),
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({ oneDark: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/prism/javascript', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/prism/typescript', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/prism/python', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/prism/java', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/prism/bash', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/prism/sql', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/prism/json', () => ({ default: {} }));
vi.mock('react-syntax-highlighter/dist/esm/languages/prism/css', () => ({ default: {} }));

describe('CardContent', () => {
  it('renders plain text with no code fences as-is', () => {
    render(<CardContent text="What is React?" />);

    expect(screen.getByText('What is React?')).toBeInTheDocument();
    expect(screen.queryByTestId('code-block')).not.toBeInTheDocument();
  });

  it('renders empty string without error', () => {
    const { container } = render(<CardContent text="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a single code fence as a code block', () => {
    const text = '```js\nconst x = 42;\n```';
    render(<CardContent text={text} />);

    const block = screen.getByTestId('code-block');
    expect(block).toBeInTheDocument();
    expect(block).toHaveAttribute('data-language', 'js');
    expect(block.textContent).toContain('const x = 42;');
  });

  it('renders mixed text and code fence correctly', () => {
    const text = 'Here is the function:\n```python\ndef foo():\n    return 1\n```\nAny questions?';
    render(<CardContent text={text} />);

    expect(screen.getByText(/Here is the function:/)).toBeInTheDocument();
    expect(screen.getByText(/Any questions?/)).toBeInTheDocument();
    const block = screen.getByTestId('code-block');
    expect(block).toBeInTheDocument();
    expect(block).toHaveAttribute('data-language', 'python');
  });

  it('renders multiple code blocks', () => {
    const text = '```js\nconst a = 1;\n```\nversus\n```ts\nconst b: number = 2;\n```';
    render(<CardContent text={text} />);

    const blocks = screen.getAllByTestId('code-block');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toHaveAttribute('data-language', 'js');
    expect(blocks[1]).toHaveAttribute('data-language', 'ts');
  });

  it('renders unclosed fence as plain text without crashing', () => {
    const text = '```js\nconst x = 1;';
    render(<CardContent text={text} />);

    expect(screen.queryByTestId('code-block')).not.toBeInTheDocument();
    expect(screen.getByText(/const x = 1;/)).toBeInTheDocument();
  });

  it('renders code block with unknown language tag without crashing', () => {
    const text = '```kotlin\nfun main() {}\n```';
    render(<CardContent text={text} />);

    const block = screen.getByTestId('code-block');
    expect(block).toBeInTheDocument();
    expect(block).toHaveAttribute('data-language', 'kotlin');
  });

  it('renders code fence with no language tag', () => {
    const text = '```\nsome code\n```';
    render(<CardContent text={text} />);

    const block = screen.getByTestId('code-block');
    expect(block).toBeInTheDocument();
    expect(block.textContent).toContain('some code');
  });
});
