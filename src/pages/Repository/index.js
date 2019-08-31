import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, Pagination } from './styles';

class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'open',
          per_page: 5,
          page,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleFilterChange = async e => {
    const { value } = e.target;

    await this.setState({ filterState: String(value) });

    this.loadIssues();
  };

  handlePrevPage = async () => {
    const { page } = this.state;

    await this.setState({
      page: page === 1 ? page : page - 1,
    });

    this.loadIssues();
  };

  handleNextPage = async () => {
    const { page } = this.state;

    await this.setState({
      page: page + 1,
    });

    this.loadIssues();
  };

  loadIssues = async () => {
    const { match } = this.props;
    const { filterState, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filterState,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: issues.data,
    });
  };

  render() {
    const { repository, issues, loading, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <select onChange={this.handleFilterChange}>
            <option value="open">Aberto</option>
            <option value="closed">Fechado</option>
            <option value="all">Todos</option>
          </select>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
          <Pagination>
            <button
              type="button"
              disabled={page < 2}
              onClick={this.handlePrevPage}
            >
              Anterior
            </button>
            <button type="button" onClick={this.handleNextPage}>
              Próxima
            </button>
          </Pagination>
        </IssueList>
      </Container>
    );
  }
}

export default Repository;
