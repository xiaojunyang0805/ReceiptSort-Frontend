import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    // Get Web3Forms access key from environment
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY?.trim()

    if (!accessKey) {
      return NextResponse.json(
        { success: false, message: 'Contact form is not configured' },
        { status: 500 }
      )
    }

    // Add access key to form data
    formData.append('access_key', accessKey)

    // Forward to Web3Forms API
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully!',
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message || 'Failed to send message',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred while sending your message',
      },
      { status: 500 }
    )
  }
}
