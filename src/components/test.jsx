import { useEffect, useState } from 'react'

function Test() {
    const [message, setMessage] = useState('')

    useEffect(() => {
        console.log('Test component mounted')
        async function loadMessage() {
            try {
                const response = await fetch('http://localhost:3000/content/test')
                if (!response.ok) {
                    throw new Error('Request failed')
                }
                const data = await response.json()
                setMessage(data.message)
            } catch (error) {
                console.error('Error:', error)
            }
        }

    }, [])

  return (
    <p>{message}</p>
  )
}

export default Test