export async function get_form_url(name: string): Promise<string> {
  try {
    const response = await fetch('/api/get-form-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    return data.submitAddr || '#';
  } catch (error) {
    console.error('Failed to get form URL:', error);
    return '#';
  }
}