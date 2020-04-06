import { h } from 'snabbdom'
import { VNode } from 'snabbdom/vnode';
import { spinner, bind, numberRow, playerName, dataIcon, player as renderPlayer, miniBoard } from './util';
import { opposite } from 'chessground/util';
import { teamName } from './battle';
import * as status from 'game/status';
import TournamentController from '../ctrl';

function result(win, stat): string {
  switch (win) {
    case true:
      return '1';
    case false:
      return '0';
    default:
      return stat >= status.ids.mate ? '½' : '*';
  }
}

function playerTitle(player) {
  return h('h2', [
    h('span.rank', player.rank + '. '),
    renderPlayer(player, true, false, false)
  ]);
}

function setup(vnode: VNode) {
  const el = vnode.elm as HTMLElement, p = window.lichess.powertip;
  p.manualUserIn(el);
  p.manualGameIn(el);
}

function previewPlayer(player) {
  return h('div.tour__preview__player', [
    h('strong', '#' + player.rank),
    renderPlayer(player, true, true, false),
    player.berserk ? h('i', {
      attrs: {
        'data-icon': '`',
        title: 'Berserk'
      }
    }) : null
  ]);
}

function preview(f): VNode {
  return h('div.tour__preview', [
    previewPlayer(f[opposite(f.color)]),
    miniBoard(f),
    previewPlayer(f[f.color])
  ]);
}

export default function(ctrl: TournamentController): VNode {
  const data = ctrl.playerInfo.data;
  const noarg = ctrl.trans.noarg;
  const tag = 'div.tour__player-info.tour__actor-info';
  if (!data || data.player.id !== ctrl.playerInfo.id) return h(tag, [
    h('div.stats', [
      playerTitle(ctrl.playerInfo.player),
      spinner()
    ])
  ]);
  const nb = data.player.nb,
    pairingsLen = data.pairings.length,
    pairingsHead = pairingsLen ? data.pairings[0] : null,
    runningPairing = pairingsHead && pairingsHead.status == status.ids.started ? pairingsHead : null,
    avgOp = pairingsLen ? Math.round(data.pairings.reduce(function(a, b) {
      return a + b.op.rating;
    }, 0) / pairingsLen) : undefined;
  return h(tag, {
    hook: {
      insert: setup,
      postpatch(_, vnode) { setup(vnode) }
    }
  }, [
    h('a.close', {
      attrs: dataIcon('L'),
      hook: bind('click', () => ctrl.showPlayerInfo(data.player), ctrl.redraw)
    }),
    h('div.stats', [
      playerTitle(data.player),
      data.player.team ? h('team', {
        hook: bind('click', () => ctrl.showTeamInfo(data.player.team), ctrl.redraw)
      }, [teamName(ctrl.data.teamBattle!, data.player.team)]) : null,
      h('table', [
        data.player.performance ? numberRow(
          noarg('performance'),
          data.player.performance + (nb.game < 3 ? '?' : ''),
          'raw') : null,
        numberRow(noarg('gamesPlayed'), nb.game),
        ...(nb.game ? [
          numberRow(noarg('winRate'), [nb.win, nb.game], 'percent'),
          numberRow(noarg('berserkRate'), [nb.berserk, nb.game], 'percent'),
          numberRow(noarg('averageOpponent'), avgOp, 'raw')
        ] : [])
      ])
    ]),
    runningPairing ? preview(runningPairing) : null,
    h('div', [
      h('table.pairings.sublist', {
        hook: bind('click', e => {
          const href = ((e.target as HTMLElement).parentNode as HTMLElement).getAttribute('data-href');
          if (href) window.open(href, '_blank');
        })
      }, data.pairings.map(function(p, i) {
          const res = result(p.win, p.status);
          return h('tr.glpt.' + (res === '1' ? ' win' : (res === '0' ? ' loss' : '')), {
            key: p.id,
            attrs: { 'data-href': '/' + p.id + '/' + p.color },
            hook: {
              destroy: vnode => $.powerTip.destroy(vnode.elm as HTMLElement)
            }
          }, [
            h('th', '' + (Math.max(nb.game, pairingsLen) - i)),
            h('td', playerName(p.op)),
            h('td', p.op.rating),
            h('td.is.color-icon.' + p.color),
            h('td', res)
          ]);
        }))
    ])
  ]);
};
