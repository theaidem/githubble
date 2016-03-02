import { bindActionCreators } from 'redux'
import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import Board from './Board'
import Load from '../components/Load'
import Error from '../components/Error'
import * as AppActions from '../actions/app'

class App extends Component {
	
	constructor(props) {
		super(props)
	}

	componentWillMount() {
		const { doAppInit } = this.props
		doAppInit()
	}

	componentDidMount() {
		const { appReset } = this.props
		//setTimeout(() => (appReset()), 5000)
	}

	render() {
		const { isLoading, err } = this.props
		if (err) {return <Error err={err}/>}
		return isLoading ? <Load/> : <Board/>
	}

}

App.propTypes = {
	isLoading: PropTypes.bool.isRequired,
}

function mapStateToProps(state) {
	return {
		isLoading: state.app.isLoading,
		err: state.app.err
	}
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(AppActions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(App)
