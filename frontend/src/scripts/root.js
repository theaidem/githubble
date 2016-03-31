import React, { Component, PropTypes } from 'react'
import { Provider } from 'react-redux'
import GitHubRibbon from "./components/GitHubRibbon"
import App from './containers/App'

class Root extends Component {

	render() {
		const { store } = this.props
		return (
			<div>
				<GitHubRibbon />
				<Provider store={store}>
					<App />
				</Provider>
			</div>
		);
	}
}

Root.propTypes = {
	store: PropTypes.object.isRequired,
}

export default Root
