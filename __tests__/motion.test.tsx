import React, { useState } from 'react';
import { TextInput, useWindowDimensions } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Button, Input, Screen } from '../src/components/UI';
import { flattenContent } from '../src/components/Motion';
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ width: 320, height: 568, scale: 2, fontScale: 1 })),
}));
function Form({
  step,
  onSave,
}: {
  step: number;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <Screen
      animationKey={step}
      footer={
        <Button title="Save my reflection" onPress={() => onSave(value)} />
      }
    >
      <Input value={value} onChangeText={setValue} />
    </Screen>
  );
}
test.each([
  [320, 568],
  [375, 667],
])(
  'replaying entrance animations at %ix%i preserves text and working footer actions',
  async (width, height) => {
    jest
      .mocked(useWindowDimensions)
      .mockReturnValue({ width, height, scale: 2, fontScale: 1 });
    const save = jest.fn();
    let tree!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = ReactTestRenderer.create(<Form step={0} onSave={save} />);
    });
    await act(async () =>
      tree.root.findByType(TextInput).props.onChangeText('My own conclusion'),
    );
    await act(async () => tree.update(<Form step={1} onSave={save} />));
    expect(tree.root.findByType(TextInput).props.value).toBe(
      'My own conclusion',
    );
    await act(async () => tree.root.findByType(Button).props.onPress());
    expect(save).toHaveBeenCalledWith('My own conclusion');
    await act(async () => tree.unmount());
  },
);
test('nested conditional groups keep their individual entrance order', () => {
  const children = flattenContent(
    <>
      <React.Fragment>
        <Button title="First" onPress={() => {}} />
        {false}
        <Button title="Second" onPress={() => {}} />
      </React.Fragment>
      <Button title="Third" onPress={() => {}} />
    </>,
  );
  expect(
    children.map(
      child => (child as React.ReactElement<{ title: string }>).props.title,
    ),
  ).toEqual(['First', 'Second', 'Third']);
});
