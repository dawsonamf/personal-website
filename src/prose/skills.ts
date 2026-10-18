import { prose } from './site.ts';

/** Keep paragraph boundaries while allowing individual passages to be approved separately. */
export function skillParagraphs(groupIndex: number): string[] {
  const paragraphs: string[] = [];
  prose.data.home.skills.groups[groupIndex].body.forEach((passage, passageIndex) => {
    const next = prose.paragraphs(`home.skills.groups.${groupIndex}.body.${passageIndex}.text`, 'l');
    if (passage.continues && paragraphs.length > 0 && next.length > 0) {
      paragraphs[paragraphs.length - 1] += ` ${next[0]}`;
      paragraphs.push(...next.slice(1));
    } else {
      paragraphs.push(...next);
    }
  });
  return paragraphs;
}
