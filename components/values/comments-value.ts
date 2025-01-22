import { type Value } from '@udecode/plate-common';

export const commentsData = {
  c1: {
    id: 'c1',
    userId: '1',
    value: [
      {
        type: 'p',
        children: [{ text: 'Example comment' }],
      }
    ] as Value,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
}; 