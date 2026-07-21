import { EuiPanel, EuiTitle } from '@elastic/eui';
export function QuestionRail({ questions, label = 'This surface must answer' }: { questions: readonly string[]; label?: string }) {
  return <EuiPanel paddingSize="m" className="questionRail" data-visual-region="question-rail"><EuiTitle size="xs"><h2>{label}</h2></EuiTitle><ol>{questions.map((question) => <li key={question}>{question}</li>)}</ol></EuiPanel>;
}
