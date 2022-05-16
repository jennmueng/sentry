import {initializeOrg} from 'sentry-test/initializeOrg';
import {render, screen, waitFor} from 'sentry-test/reactTestingLibrary';

import {Client} from 'sentry/api';
import {DisplayType, WidgetType} from 'sentry/views/dashboardsV2/types';
import ReleaseWidgetQueries from 'sentry/views/dashboardsV2/widgetCard/releaseWidgetQueries';

describe('Dashboards > ReleaseWidgetQueries', function () {
  const {organization} = initializeOrg();

  const badMessage = 'Bad request data';

  const multipleQueryWidget = {
    title: 'Sessions vs. Users',
    interval: '5m',
    displayType: DisplayType.LINE,
    queries: [
      {
        conditions: '',
        fields: [`sum(session)`],
        aggregates: [`sum(session)`],
        columns: [],
        name: 'sessions',
        orderby: '',
      },
      {
        conditions: 'environment:prod',
        fields: [`sum(session)`],
        aggregates: [`sum(session)`],
        columns: [],
        name: 'users',
        orderby: '',
      },
    ],
    widgetType: WidgetType.RELEASE,
  };
  const singleQueryWidget = {
    title: 'Sessions',
    interval: '5m',
    displayType: DisplayType.LINE,
    queries: [
      {
        conditions: '',
        fields: [`count_unique(user)`],
        aggregates: [`count_unique(user)`],
        columns: [],
        name: 'sessions',
        orderby: '-count_unique(user)',
      },
    ],
    widgetType: WidgetType.RELEASE,
  };
  const selection = {
    projects: [1],
    environments: ['prod'],
    datetime: {
      period: '14d',
      start: null,
      end: null,
      utc: null,
    },
  };

  const api = new Client();

  afterEach(function () {
    MockApiClient.clearMockResponses();
  });

  it('can send chart requests', async function () {
    const mock = MockApiClient.addMockResponse({
      url: '/organizations/org-slug/metrics/data/',
      body: TestStubs.MetricsField({
        field: `sum(sentry.sessions.session)`,
      }),
    });
    const children = jest.fn(() => <div />);

    render(
      <ReleaseWidgetQueries
        api={api}
        widget={singleQueryWidget}
        organization={organization}
        selection={selection}
      >
        {children}
      </ReleaseWidgetQueries>
    );

    expect(mock).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(children).toHaveBeenLastCalledWith(
        expect.objectContaining({
          tableResults: [],
          timeseriesResults: [
            {
              data: expect.arrayContaining([
                {name: '2021-12-01T16:15:00Z', value: 443.6200417187068},
                {name: '2021-12-01T16:30:00Z', value: 471.7512262596214},
                {name: '2021-12-01T16:45:00Z', value: 632.5356294251225},
                {name: '2021-12-01T17:00:00Z', value: 538.6063865509535},
              ]),
              seriesName: 'sessions > sum(session)',
            },
          ],
        })
      )
    );
  });

  it('calls session api when session.status is a group by', async function () {
    const mock = MockApiClient.addMockResponse({
      url: '/organizations/org-slug/sessions/',
      body: TestStubs.MetricsField({
        field: `count_unique(user)`,
      }),
    });
    const children = jest.fn(() => <div />);
    const queries = [
      {
        conditions: '',
        fields: [`count_unique(user)`],
        aggregates: [`count_unique(user)`],
        columns: ['session.status'],
        name: 'sessions',
        orderby: '-count_unique(user)',
      },
    ];

    render(
      <ReleaseWidgetQueries
        api={api}
        widget={{...singleQueryWidget, queries}}
        organization={organization}
        selection={selection}
      >
        {children}
      </ReleaseWidgetQueries>
    );

    expect(mock).toHaveBeenCalledWith(
      '/organizations/org-slug/sessions/',
      expect.objectContaining({
        query: {
          environment: ['prod'],
          field: ['count_unique(user)'],
          groupBy: ['session.status'],
          interval: '30m',
          project: [1],
          statsPeriod: '14d',
        },
      })
    );
  });

  it('can send table requests', async function () {
    const mock = MockApiClient.addMockResponse({
      url: '/organizations/org-slug/metrics/data/',
      body: TestStubs.MetricsSessionUserCountByStatusByRelease(),
    });
    const children = jest.fn(() => <div />);

    render(
      <ReleaseWidgetQueries
        api={api}
        widget={{...singleQueryWidget, displayType: DisplayType.TABLE}}
        organization={organization}
        selection={selection}
      >
        {children}
      </ReleaseWidgetQueries>
    );
    expect(mock).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(children).toHaveBeenLastCalledWith(
        expect.objectContaining({
          errorMessage: undefined,
          loading: false,
          tableResults: [
            {
              data: [
                {
                  'count_unique(user)': 1,
                  id: '0',
                  release: '1',
                  'session.status': 'crashed',
                  'sum(session)': 34,
                },
                {
                  'count_unique(user)': 1,
                  id: '1',
                  release: '1',
                  'session.status': 'abnormal',
                  'sum(session)': 1,
                },
                {
                  'count_unique(user)': 2,
                  id: '2',
                  release: '1',
                  'session.status': 'errored',
                  'sum(session)': 451,
                },
                {
                  'count_unique(user)': 3,
                  id: '3',
                  release: '1',
                  'session.status': 'healthy',
                  'sum(session)': 5058,
                },
                {
                  'count_unique(user)': 2,
                  id: '4',
                  release: '2',
                  'session.status': 'crashed',
                  'sum(session)': 35,
                },
                {
                  'count_unique(user)': 1,
                  id: '5',
                  release: '2',
                  'session.status': 'abnormal',
                  'sum(session)': 1,
                },
                {
                  'count_unique(user)': 1,
                  id: '6',
                  release: '2',
                  'session.status': 'errored',
                  'sum(session)': 452,
                },
                {
                  'count_unique(user)': 10,
                  id: '7',
                  release: '2',
                  'session.status': 'healthy',
                  'sum(session)': 5059,
                },
              ],
              meta: {
                'count_unique(user)': 'integer',
                release: 'string',
                'session.status': 'string',
                'sum(session)': 'integer',
              },
              title: 'sessions',
            },
          ],
          timeseriesResults: [],
        })
      )
    );
  });

  it('can send big number requests', async function () {
    const mock = MockApiClient.addMockResponse({
      url: '/organizations/org-slug/metrics/data/',
      body: TestStubs.MetricsField({
        field: `count_unique(sentry.sessions.user)`,
      }),
    });
    const children = jest.fn(() => <div />);

    render(
      <ReleaseWidgetQueries
        api={api}
        widget={{...singleQueryWidget, displayType: DisplayType.BIG_NUMBER}}
        organization={organization}
        selection={selection}
      >
        {children}
      </ReleaseWidgetQueries>
    );

    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        query: expect.objectContaining({
          field: ['count_unique(sentry.sessions.user)'],
          orderBy: '-count_unique(sentry.sessions.user)',
        }),
      })
    );

    await waitFor(() =>
      expect(children).toHaveBeenLastCalledWith(
        expect.objectContaining({
          loading: false,
          tableResults: [
            {
              data: [{'count_unique(user)': 51292.95404741901, id: '0'}],
              meta: {'count_unique(user)': 'integer'},
              title: 'sessions',
            },
          ],
        })
      )
    );
  });

  it('can send multiple API requests', function () {
    const metricsMock = MockApiClient.addMockResponse({
      url: '/organizations/org-slug/metrics/data/',
      body: TestStubs.SessionsField({
        field: `sum(sentry.sessions.session)`,
      }),
      match: [
        MockApiClient.matchQuery({
          field: [`sum(sentry.sessions.session)`],
        }),
      ],
    });
    render(
      <ReleaseWidgetQueries
        api={api}
        widget={multipleQueryWidget}
        organization={organization}
        selection={selection}
      >
        {() => <div data-test-id="child" />}
      </ReleaseWidgetQueries>
    );
    // Child should be rendered and 2 requests should be sent.
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(metricsMock).toHaveBeenCalledTimes(2);
    expect(metricsMock).toHaveBeenNthCalledWith(
      1,
      '/organizations/org-slug/metrics/data/',
      expect.objectContaining({
        query: {
          environment: ['prod'],
          field: ['sum(sentry.sessions.session)'],
          groupBy: [],
          interval: '30m',
          project: [1],
          statsPeriod: '14d',
        },
      })
    );
    expect(metricsMock).toHaveBeenNthCalledWith(
      2,
      '/organizations/org-slug/metrics/data/',
      expect.objectContaining({
        query: {
          environment: ['prod'],
          field: ['sum(sentry.sessions.session)'],
          groupBy: [],
          interval: '30m',
          project: [1],
          query: 'environment:prod',
          statsPeriod: '14d',
        },
      })
    );
  });

  it('sets errorMessage when the first request fails', async function () {
    const failMock = MockApiClient.addMockResponse({
      url: '/organizations/org-slug/metrics/data/',
      statusCode: 400,
      body: {detail: badMessage},
      match: [
        MockApiClient.matchQuery({
          field: [`sum(sentry.sessions.session)`],
        }),
      ],
    });
    const children = jest.fn(() => <div data-test-id="child" />);

    render(
      <ReleaseWidgetQueries
        api={api}
        widget={multipleQueryWidget}
        organization={organization}
        selection={selection}
      >
        {children}
      </ReleaseWidgetQueries>
    );

    // Child should be rendered and 2 requests should be sent.
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(failMock).toHaveBeenCalledTimes(2);
    await waitFor(() =>
      expect(children).toHaveBeenLastCalledWith(
        expect.objectContaining({errorMessage: badMessage})
      )
    );
  });

  it('adjusts interval based on date window', function () {
    const mock = MockApiClient.addMockResponse({
      url: '/organizations/org-slug/metrics/data/',
      body: TestStubs.SessionsField({
        field: `sum(sentry.sessions.session)`,
      }),
    });

    render(
      <ReleaseWidgetQueries
        api={api}
        widget={{...singleQueryWidget, interval: '1m'}}
        organization={organization}
        selection={{...selection, datetime: {...selection.datetime, period: '90d'}}}
      >
        {() => <div data-test-id="child" />}
      </ReleaseWidgetQueries>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        query: expect.objectContaining({
          interval: '4h',
          statsPeriod: '90d',
          environment: ['prod'],
          project: [1],
        }),
      })
    );
  });

  it('does not re-fetch when renaming legend alias / adding falsy fields', () => {
    const mock = MockApiClient.addMockResponse({
      url: '/organizations/org-slug/metrics/data/',
      body: TestStubs.SessionsField({
        field: `sum(sentry.sessions.session)`,
      }),
    });
    const children = jest.fn(() => <div />);

    const {rerender} = render(
      <ReleaseWidgetQueries
        api={api}
        widget={singleQueryWidget}
        organization={organization}
        selection={selection}
      >
        {children}
      </ReleaseWidgetQueries>
    );

    expect(mock).toHaveBeenCalledTimes(1);

    rerender(
      <ReleaseWidgetQueries
        api={api}
        widget={{
          ...singleQueryWidget,
          queries: [
            {
              ...singleQueryWidget.queries[0],
              name: 'New Legend Alias',
              fields: [...singleQueryWidget.queries[0].fields, ''],
            },
          ],
        }}
        organization={organization}
        selection={selection}
      >
        {children}
      </ReleaseWidgetQueries>
    );

    // no additional request has been sent, the total count of requests is still 1
    expect(mock).toHaveBeenCalledTimes(1);
  });
});
