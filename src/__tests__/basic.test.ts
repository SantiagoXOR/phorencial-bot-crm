// Basic test to verify Jest setup
describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle strings', () => {
    expect('hello').toBe('hello')
  })

  it('should handle arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 }
    expect(obj).toHaveProperty('name', 'test')
    expect(obj.value).toBe(42)
  })
})

// Test environment variables
describe('Environment Setup', () => {
  it('should have test environment variables', () => {
    expect(process.env.NEXTAUTH_SECRET).toBe('test-secret')
    expect(process.env.NEXTAUTH_URL).toBe('http://localhost:3000')
  })
})

// Test mocking
describe('Mocking Tests', () => {
  it('should mock functions', () => {
    const mockFn = jest.fn()
    mockFn('test')
    
    expect(mockFn).toHaveBeenCalledWith('test')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should mock return values', () => {
    const mockFn = jest.fn().mockReturnValue('mocked')
    
    expect(mockFn()).toBe('mocked')
  })
})
