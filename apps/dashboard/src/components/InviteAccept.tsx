/**
 * Copyright 2026 Abdurakhman Rakhmankulov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useQuery } from '@tanstack/react-query'
import { TerminalView } from './Terminal'
import { api } from '../lib/api'

interface InviteAcceptProps {
  inviteToken: string
}

interface InviteData {
  sessionId: string
  tool: string
  inviterId: string
}

export function InviteAccept({ inviteToken }: InviteAcceptProps) {
  const {
    data: invite,
    isLoading,
    error,
  } = useQuery<InviteData>({
    queryKey: ['invite', inviteToken],
    queryFn: () => api.get(`/api/v1/invites/${inviteToken}`),
  })

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-[var(--color-text-dim)]">Loading invite...</div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-[var(--color-red)]">Invalid or expired invite</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <div
        className="flex items-center gap-4 px-4 py-2"
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span className="text-sm text-[var(--color-accent)]">Pair Session</span>
        <span className="text-sm text-[var(--color-text-dim)]">
          {invite.tool} · Invited by {invite.inviterId.slice(0, 8)}
        </span>
      </div>
      <div className="flex-1">
        <TerminalView sessionId={invite.sessionId} />
      </div>
    </div>
  )
}
