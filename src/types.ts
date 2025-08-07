export interface ISource {
  path: string;
  title: string;
}

export interface IState {
  sources: Array<ISource>;
}
