import React, { Component } from 'react'
import SessionTime from "./SessionTime"
import AppStats from "../containers/AppStats"

class Stats extends Component {

	constructor(props) {
		super(props)
	}

	bestStargazersList(items, actors) {
		return (
			<div className="ui attached segment">
				<h4 className="ui header">Best stargazers</h4>
				<div className="ui list">
					{items.map((a) => {
						if (a.stars.length > 1) {
							const actor = actors[a.id]
							return (
								<div className="item" key={actor.id}>
									<img className="ui mini image" src={ actor.avatar_url }/>
									<div className="content">
										<a className="ui header" target="_blank" href={`https:\/\/github.com/${actor.login}`}>
											<h5>{actor.login}</h5>
										</a>
										{a.stars.length} stars
									</div>
								</div>
							)
						}
					})}
				</div>
			</div>
		)
	}

	mostStarredList(items, repos) {
		return (
			<div className="ui attached segment">
				<h4 className="ui header">Most starred</h4>
				<div className="ui most-starred list">
					{items.map((a) => {
						if (a.stars.length > 1) {
							const repo = repos[a.id]
							return (
								<div className="item" key={repo.id}>
									<span className="octicon octicon-repo"></span>
									<div className="content">
										<a className="header" target="_blank" href={`https:\/\/github.com/${repo.name}`}>{ repo.name }</a>
										{a.stars.length} stars
									</div>
								</div>
							)
						}
					})}
				</div>
			</div>
		)
	}

	bestForkersList(items, actors) {
		return (
			<div className="ui attached segment">
				<h4 className="ui header">Best forkers</h4>
				<div className="ui list">
					{items.map((a) => {
						if (a.forks.length > 1) {
							const actor = actors[a.id]
							return (
								<div className="item" key={actor.id}>
									<img className="ui mini image" src={ actor.avatar_url }/>
									<div className="content">
										<a className="ui header" target="_blank" href={`https:\/\/github.com/${actor.login}`}>
											<h5>{actor.login}</h5>
										</a>
										{a.forks.length} forks
									</div>
								</div>
							)
						}
					})}
				</div>
			</div>
		)
	}

	mostForkedList(items, repos) {
		return (
			<div className="ui attached segment">
				<h4 className="ui header">Most forked</h4>
				<div className="ui most-forked list">
					{items.map((a) => {
						if (a.forks.length > 1) {
							const repo = repos[a.id]
							return (
								<div className="item" key={repo.id}>
									<span className="octicon octicon-repo"></span>
									<div className="content">
										<a className="header" target="_blank" href={`https:\/\/github.com/${repo.name}`}>{ repo.name }</a>
										{a.forks.length} forks
									</div>
								</div>
							)
						}
					})}
				</div>
			</div>	
		)
	}

	render() {
		const { bestStargazers,  bestForkers, mostStarred, mostForked, events, actors, repos, started} = this.props
		return (
			<div className="stats">
				<h5 className="ui top attached header">
					<div className="right">{Object.keys(actors).length}</div>
					Actors
				</h5>

				{ bestStargazers.some((a) => a.stars.length > 1) ? this.bestStargazersList(bestStargazers, actors) : null }

				{ bestForkers.some((a) => a.forks.length > 1) ? this.bestForkersList(bestForkers, actors) : null }

				<h5 className="ui attached header">
					<div className="right">{Object.keys(repos).length}</div>
					Repos 
				</h5>

				{ mostStarred.some((a) => a.stars.length > 1) ? this.mostStarredList(mostStarred, repos) : null }

				{ mostForked.some((a) => a.forks.length > 1) ? this.mostForkedList(mostForked, repos) : null }
			
				<div className="ui bottom attached info message">
					<i className="info icon"></i>
					Statistic from <SessionTime started={ started }/>
				</div>
				<AppStats/>
			</div>	
		)
	}
}

export default Stats