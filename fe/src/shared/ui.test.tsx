import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Japanese, Pagination, usePreferences } from './ui'

afterEach(() => { cleanup(); usePreferences.setState({ furigana: true }) })

describe('Giao diện học tập', () => {
  it('hiển thị Ruby và ẩn Furigana khi người đọc tắt', () => {
    const { container } = render(<Japanese text="学校へ行きます" reading="{学校|がっこう}へ{行|い}きます" />)
    expect(container.querySelector('rt')).toHaveTextContent('がっこう')
    act(() => usePreferences.getState().toggleFurigana())
    expect(screen.getByText('学校へ行きます').querySelector('rt')).toBeNull()
  })
  it('vô hiệu hóa nút quay lại ở trang đầu', () => {
    render(<Pagination page={1} pages={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled()
  })
})
