import { useState } from 'react'
import { useSharedBudgets } from '../hooks/useSharedBudgets'
import { useAccountContext } from '../hooks/useAccountContext'
import { useLocale } from '../hooks/useLocale'

interface SharedBudgetManagerProps {
  open: boolean
  onClose: () => void
}

export function SharedBudgetManager({ open, onClose }: SharedBudgetManagerProps) {
  const { invitesSent, invitesReceived, sendInvite, acceptInvite, revokeAccess, leaveShared, loading } = useSharedBudgets()
  const { activeContext, isSharedMode, switchToShared, switchToPersonal } = useAccountContext()
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  if (!open) return null

  const acceptedSent = invitesSent.filter(i => i.status === 'accepted')
  const pendingSent = invitesSent.filter(i => i.status === 'pending')
  const acceptedReceived = invitesReceived.filter(i => i.status === 'accepted')
  const pendingReceived = invitesReceived.filter(i => i.status === 'pending')

  const handleSendInvite = async () => {
    if (!email.trim()) return
    setSending(true)
    setError('')
    const result = await sendInvite(email.trim())
    setSending(false)
    if (result.error) {
      setError(result.error)
    } else {
      setEmail('')
    }
  }

  const handleSwitchToShared = async (ownerId: string, ownerEmail: string, budgetId: string) => {
    await switchToShared(ownerId, ownerEmail, budgetId)
    onClose()
  }

  const handleSwitchToPersonal = async () => {
    await switchToPersonal()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 pb-8 z-10 max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-6 sm:hidden" />

        <h2 className="font-headline font-bold text-xl text-on-primary-fixed mb-6">
          {t('shared.title')}
        </h2>

        {/* Active context indicator */}
        {isSharedMode && activeContext.type === 'shared' && (
          <div className="bg-tertiary-container/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-on-primary-fixed text-sm font-semibold">{t('shared.viewingShared')}</p>
              <p className="text-on-surface-variant text-xs">{activeContext.ownerEmail}</p>
            </div>
            <button
              onClick={handleSwitchToPersonal}
              className="text-xs font-semibold text-on-tertiary-container bg-tertiary-container/30 rounded-lg px-3 py-1.5 hover:bg-tertiary-container/50 transition-colors"
            >
              {t('shared.switchToMine')}
            </button>
          </div>
        )}

        {/* Accepted shared budgets I can switch to */}
        {acceptedReceived.length > 0 && !isSharedMode && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-3">{t('shared.sharedWithYou')}</h3>
            <div className="space-y-2">
              {acceptedReceived.map(invite => (
                <div key={invite.id} className="bg-surface rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-on-primary-fixed text-sm font-semibold">{invite.ownerEmail}</p>
                    <p className="text-on-surface-variant text-xs">{t('shared.accepted')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSwitchToShared(invite.ownerId, invite.ownerEmail, invite.id)}
                      className="text-xs font-semibold text-on-primary bg-primary-container rounded-lg px-3 py-1.5 hover:opacity-90 transition-colors"
                    >
                      {t('shared.viewBudget')}
                    </button>
                    <button
                      onClick={() => leaveShared(invite.id)}
                      className="text-xs font-semibold text-error bg-error/5 rounded-lg px-3 py-1.5 hover:bg-error/10 transition-colors"
                    >
                      {t('shared.leave')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted sent - people who share my budget */}
        {acceptedSent.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-3">{t('shared.sharingWith')}</h3>
            <div className="space-y-2">
              {acceptedSent.map(invite => (
                <div key={invite.id} className="bg-surface rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-on-primary-fixed text-sm font-semibold">{invite.memberEmail}</p>
                    <p className="text-on-tertiary-container text-xs">{t('shared.active')}</p>
                  </div>
                  <button
                    onClick={() => revokeAccess(invite.id)}
                    className="text-xs font-semibold text-error bg-error/5 rounded-lg px-3 py-1.5 hover:bg-error/10 transition-colors"
                  >
                    {t('shared.revoke')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending invites received */}
        {pendingReceived.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-3">{t('shared.pendingInvitations')}</h3>
            <div className="space-y-2">
              {pendingReceived.map(invite => (
                <div key={invite.id} className="bg-surface rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-on-primary-fixed text-sm font-semibold">{invite.ownerEmail}</p>
                    <p className="text-on-surface-variant text-xs">{t('shared.wantsToShare')}</p>
                  </div>
                  <button
                    onClick={() => acceptInvite(invite.id)}
                    className="text-xs font-semibold text-on-primary bg-primary-container rounded-lg px-3 py-1.5 hover:opacity-90 transition-colors"
                  >
                    {t('shared.accept')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending invites sent */}
        {pendingSent.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-3">{t('shared.waitingResponse')}</h3>
            <div className="space-y-2">
              {pendingSent.map(invite => (
                <div key={invite.id} className="bg-surface rounded-xl p-4 flex items-center justify-between">
                  <p className="text-on-surface-variant text-sm">{invite.memberEmail}</p>
                  <span className="text-xs text-outline">{t('shared.pending')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send invite */}
        <div className="border-t border-outline-variant/20 pt-5">
          <h3 className="text-xs font-semibold tracking-wide text-on-surface-variant mb-3">{t('shared.inviteSomeone')}</h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder={t('shared.invitePlaceholder')}
              className="flex-grow bg-surface rounded-xl px-4 py-3 text-sm text-on-primary-fixed border-none outline-none placeholder:text-outline-variant"
              onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
            />
            <button
              onClick={handleSendInvite}
              disabled={sending || !email.trim()}
              className="px-4 py-3 bg-primary-container text-on-primary font-semibold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              {sending ? '...' : t('shared.invite')}
            </button>
          </div>
          {error && (
            <p className="text-error text-xs mt-2">{error}</p>
          )}
          <p className="text-outline text-xs mt-3">
            {t('shared.inviteHint')}
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
          </div>
        )}
      </div>
    </div>
  )
}
