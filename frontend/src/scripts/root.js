import React, { Component, PropTypes } from 'react'
import { Provider } from 'react-redux'
import App from './containers/App'

class Root extends Component {

	render() {
		const { store } = this.props
		return (
			<Provider store={store}>
				 <App />
			</Provider>
		);
	}
}

Root.propTypes = {
	store: PropTypes.object.isRequired,
}

export default Root
