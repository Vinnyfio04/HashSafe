import { useState } from 'react'
import Navbar     from '../components/Navbar'
import UploadTab  from '../components/UploadTab'
import HashesTab  from '../components/HashesTab'
import ContentTab from '../components/ContentTab'
import VerifyTab  from '../components/VerifyTab'

export default function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('upload')

  return (
    <div style={styles.shell}>
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
      />

      <main style={styles.main}>
        {activeTab === 'upload'  && <UploadTab  user={user} />}
        {activeTab === 'hashes'  && <HashesTab  />}
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'verify'  && <VerifyTab  />}
      </main>
    </div>
  )
}

const styles = {
  shell: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '32px 24px 64px',
  },
}