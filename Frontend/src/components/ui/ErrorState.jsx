import { CloudOff } from 'lucide-react'
import EmptyState from './EmptyState'
import Button from './Button'
import { getErrorMessage } from '../../services/apiClient'

export default function ErrorState({ error, onRetry, title = 'Could not load this' }) {
  return (
    <EmptyState icon={CloudOff} title={title} text={getErrorMessage(error)}
      action={onRetry && <Button variant="soft" onClick={onRetry}>Try again</Button>} />
  )
}
