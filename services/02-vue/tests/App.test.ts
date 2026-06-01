import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import App from '../src/App.vue'

describe('02-vue', () => {
  it('renders hello', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Hello from')
  })
})
